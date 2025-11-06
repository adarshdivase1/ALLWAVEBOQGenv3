import * as XLSX from 'xlsx';
import { ClientDetails, Room, BrandingSettings, Currency, CURRENCIES } from '../types';
import { companyTemplate } from '../data/scopeAndTermsData';
import { getExchangeRates } from './currency';

const createStyledCell = (value: any, style: any, type: 's' | 'n' | 'b' | 'd' = 's') => {
    return { t: type, v: value, s: style };
};

export const exportToXlsx = async (
    rooms: Room[],
    clientDetails: ClientDetails,
    margin: number,
    branding: BrandingSettings,
    selectedCurrency: Currency,
) => {
    const wb = XLSX.utils.book_new();
    const usedSheetNames = new Set<string>();

    const headerStyle = {
        fill: { fgColor: { rgb: branding.primaryColor.replace('#', 'FF') } },
        font: { color: { rgb: "FFFFFFFF" }, bold: true, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
            top: { style: 'thin', color: { auto: 1 } },
            bottom: { style: 'thin', color: { auto: 1 } },
            left: { style: 'thin', color: { auto: 1 } },
            right: { style: 'thin', color: { auto: 1 } },
        }
    };

    const sectionHeaderStyle = {
        font: { bold: true, sz: 14 },
        fill: { fgColor: { rgb: "FFD9D9D9" } } // Light Grey
    };
    
    const labelStyle = { font: { bold: true } };
    const totalStyle = { font: { bold: true }, alignment: { horizontal: 'right' } };

    const getUniqueSheetName = (baseName: string): string => {
        const sanitizedBaseName = baseName.replace(/[\\/?*[\]]/g, '');
        let name = sanitizedBaseName.substring(0, 31);
        if (!usedSheetNames.has(name)) {
            usedSheetNames.add(name);
            return name;
        }
        let i = 2;
        while (true) {
            const suffix = ` (${i})`;
            const truncatedName = sanitizedBaseName.substring(0, 31 - suffix.length);
            name = `${truncatedName}${suffix}`;
            if (!usedSheetNames.has(name)) {
                usedSheetNames.add(name);
                return name;
            }
            i++;
        }
    };

    const currencyInfo = CURRENCIES.find(c => c.value === selectedCurrency)!;
    const rates = await getExchangeRates();
    const rate = rates[selectedCurrency] || 1;
    const gstRate = 0.18;
    const sgstRate = gstRate / 2;
    const cgstRate = gstRate / 2;
    const isINR = selectedCurrency === 'INR';
    
    // --- Cover Page Sheet (Dynamically built) ---
    const coverWsData = [];
    const merges = [];

    // Row 0: Title
    coverWsData.push([createStyledCell('Project Proposal', { font: { sz: 24, bold: true } })]);
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } });

    // Row 1: Optional Logo Note
    if (branding.logoUrl) {
        coverWsData.push([createStyledCell(
            '(Your company logo has been saved and will appear on all documents printed from this application.)',
            { font: { italic: true, sz: 9, color: { rgb: "FF808080" } } }
        )]);
        merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 2 } });
    }

    coverWsData.push([]); // Spacer

    // Project Details section
    let currentRow = coverWsData.length;
    coverWsData.push([createStyledCell('Project Details', sectionHeaderStyle)]);
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 2 } });
    coverWsData.push(
        [createStyledCell('Project Name:', labelStyle), clientDetails.projectName],
        [createStyledCell('Date:', labelStyle), clientDetails.date],
        [createStyledCell('Location:', labelStyle), clientDetails.location]
    );

    coverWsData.push([]); // Spacer

    // Prepared For section
    currentRow = coverWsData.length;
    coverWsData.push([createStyledCell('Prepared For (Client)', sectionHeaderStyle)]);
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 2 } });
    coverWsData.push(
        [createStyledCell('Client Name:', labelStyle), clientDetails.clientName],
        [createStyledCell('Key Contact:', labelStyle), clientDetails.keyClientPersonnel]
    );

    coverWsData.push([]); // Spacer

    // Prepared By section
    currentRow = coverWsData.length;
    coverWsData.push([createStyledCell('Prepared By', sectionHeaderStyle)]);
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 2 } });
    coverWsData.push(
        [createStyledCell('Company:', labelStyle), branding.companyInfo.name],
        [createStyledCell('Address:', labelStyle), branding.companyInfo.address],
        [createStyledCell('Phone:', labelStyle), branding.companyInfo.phone],
        [createStyledCell('Email:', labelStyle), branding.companyInfo.email],
        [createStyledCell('Website:', labelStyle), branding.companyInfo.website],
        [createStyledCell('Account Manager:', labelStyle), clientDetails.accountManager],
        [createStyledCell('Design Engineer:', labelStyle), clientDetails.designEngineer]
    );

    const coverWs = XLSX.utils.aoa_to_sheet(coverWsData);
    coverWs["!merges"] = merges;
    coverWs['!cols'] = [{ wch: 20 }, { wch: 50 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, coverWs, 'Cover Page');

    // --- Proposal Summary Sheet ---
    const summaryWs = XLSX.utils.aoa_to_sheet([[]]);
    const summaryHeader = ['Sr. No', 'Description', `Total (${currencyInfo.value})`];
    summaryWs['!rows'] = [{ hpt: 25 }];
    summaryHeader.forEach((val, i) => summaryWs[XLSX.utils.encode_cell({c: i, r: 0})] = { v: val, s: headerStyle });
    
    let summaryRowIndex = 1;
    let projectGrandTotal = 0;

    rooms.forEach((room, index) => {
        if (room.boq) {
            let roomTotalAfterMargin = 0;
            room.boq.forEach(item => {
                const itemMarginPercent = typeof item.margin === 'number' ? item.margin : margin;
                const itemMarginMultiplier = 1 + itemMarginPercent / 100;
                roomTotalAfterMargin += (item.totalPrice * rate) * itemMarginMultiplier;
            });
            const roomFinalTotal = roomTotalAfterMargin * (1 + gstRate);
            projectGrandTotal += roomFinalTotal;
            XLSX.utils.sheet_add_aoa(summaryWs, [[index + 1, room.name, roomFinalTotal]], { origin: `A${summaryRowIndex + 1}`});
            summaryRowIndex++;
        }
    });
    
    XLSX.utils.sheet_add_aoa(summaryWs, [['', createStyledCell('Grand Total', totalStyle), createStyledCell(projectGrandTotal, totalStyle, 'n')]], { origin: `A${summaryRowIndex + 2}`});
    summaryWs['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Proposal Summary');

    // --- Commercial Terms Sheet ---
    const termsWs = XLSX.utils.aoa_to_sheet([]);
    let termsRowIndex = 0;
    Object.entries(companyTemplate.commercialTerms).forEach(([title, data]) => {
        termsRowIndex++; // Spacer
        termsWs[XLSX.utils.encode_cell({r: termsRowIndex, c: 0})] = { v: title, s: sectionHeaderStyle };
        termsWs["!merges"] = termsWs["!merges"] || [];
        termsWs["!merges"].push({ s: { r: termsRowIndex, c: 0 }, e: { r: termsRowIndex, c: 1 } });
        termsRowIndex++;
        if (data.length > 0) {
            const termsHeader = data[0];
            termsHeader.forEach((val, i) => termsWs[XLSX.utils.encode_cell({c: i, r: termsRowIndex})] = { v: val, s: headerStyle });
            termsRowIndex++;
            XLSX.utils.sheet_add_aoa(termsWs, data.slice(1), { origin: `A${termsRowIndex}` });
            termsRowIndex += data.slice(1).length;
        }
    });
    termsWs['!cols'] = [{ wch: 10 }, { wch: 100 }];
    XLSX.utils.book_append_sheet(wb, termsWs, 'Commercial Terms');

    // --- Individual Room Sheets ---
    for (const room of rooms) {
        if (room.boq) {
            const roomWs = XLSX.utils.aoa_to_sheet([]);
            let roomHeader: string[];

            if (isINR) {
                roomHeader = ['Sr. No.', 'Description of Goods / Services', 'Specifications', 'Make', 'Qty.', 'Unit Rate (INR)', 'Total (INR)', 'Margin (%)', 'Total after Margin (INR)', 'SGST 9% (INR)', 'CGST 9% (INR)', 'Total with Tax (INR)'];
            } else {
                roomHeader = ['Sr. No.', 'Description of Goods / Services', 'Specifications', 'Make', 'Qty.', `Unit Rate (${currencyInfo.value})`, `Total (${currencyInfo.value})`, 'Margin (%)', `Total after Margin (${currencyInfo.value})`, `Tax (18%) (${currencyInfo.value})`, `Total with Tax (${currencyInfo.value})`];
            }

            roomWs['!rows'] = [{ hpt: 25 }];
            roomHeader.forEach((val, i) => roomWs[XLSX.utils.encode_cell({c: i, r: 0})] = { v: val, s: headerStyle });
            
            let roomSubTotal = 0, roomTotalAfterMargin = 0, roomSgstTotal = 0, roomCgstTotal = 0, roomTaxTotal = 0, roomGrandTotal = 0;

            room.boq.forEach((item, index) => {
                const unitPriceConverted = item.unitPrice * rate;
                const totalPriceConverted = item.totalPrice * rate;
                const currentItemMarginPercent = typeof item.margin === 'number' ? item.margin : margin;
                const marginMultiplier = 1 + currentItemMarginPercent / 100;
                const totalPriceWithMargin = totalPriceConverted * marginMultiplier;
                
                let rowData: any[];

                if (isINR) {
                    const sgstAmount = totalPriceWithMargin * sgstRate;
                    const cgstAmount = totalPriceWithMargin * cgstRate;
                    const finalTotalPrice = totalPriceWithMargin + sgstAmount + cgstAmount;
                    roomSgstTotal += sgstAmount;
                    roomCgstTotal += cgstAmount;
                     rowData = [ index + 1, item.itemDescription, item.model, item.brand, item.quantity, unitPriceConverted, totalPriceConverted, currentItemMarginPercent, totalPriceWithMargin, sgstAmount, cgstAmount, finalTotalPrice ];
                } else {
                    const taxAmount = totalPriceWithMargin * gstRate;
                    const finalTotalPrice = totalPriceWithMargin + taxAmount;
                    roomTaxTotal += taxAmount;
                    rowData = [ index + 1, item.itemDescription, item.model, item.brand, item.quantity, unitPriceConverted, totalPriceConverted, currentItemMarginPercent, totalPriceWithMargin, taxAmount, finalTotalPrice ];
                }

                roomSubTotal += totalPriceConverted;
                roomTotalAfterMargin += totalPriceWithMargin;
                roomGrandTotal += rowData[rowData.length - 1]; // Total with tax is always the last item

                XLSX.utils.sheet_add_aoa(roomWs, [rowData], { origin: `A${index + 2}` });
            });
            
            const totalRowStart = room.boq.length + 3;
            const totalsOriginCol = isINR ? 'K' : 'J';
            let totalRows: [string, number][] = [
                ['Subtotal:', roomSubTotal],
                ['Total after Margin:', roomTotalAfterMargin],
            ];

            if (isINR) {
                totalRows.push(['Total SGST (9%):', roomSgstTotal], ['Total CGST (9%):', roomCgstTotal]);
            } else {
                totalRows.push(['Total Tax (18%):', roomTaxTotal]);
            }
            totalRows.push(['Grand Total:', roomGrandTotal]);

            totalRows.forEach((data, i) => {
                XLSX.utils.sheet_add_aoa(roomWs, [[createStyledCell(data[0], totalStyle), createStyledCell(data[1], totalStyle, 'n')]], { origin: `${totalsOriginCol}${totalRowStart + i}`});
            });

            if (isINR) {
                roomWs['!cols'] = [ { wch: 8 }, { wch: 40 }, { wch: 25 }, { wch: 20 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
            } else {
                 roomWs['!cols'] = [ { wch: 8 }, { wch: 40 }, { wch: 25 }, { wch: 20 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];
            }
            
            XLSX.utils.book_append_sheet(wb, roomWs, getUniqueSheetName(room.name));
        }
    }

    XLSX.writeFile(wb, `${clientDetails.projectName || 'BOQ'}_${new Date().toISOString().split('T')[0]}.xlsx`);
};