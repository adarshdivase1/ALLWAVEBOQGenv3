import * as XLSX from 'xlsx';
import { ClientDetails, Room } from '../types';
import { companyTemplate } from '../data/scopeAndTermsData';
import { getExchangeRates } from './currency';

// --- Styling Definitions ---
const headerStyle = {
    fill: { fgColor: { rgb: "FF92D050" } }, // Light Green
    font: { color: { rgb: "FFFFFFFF" }, bold: true, sz: 11 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
        top: { style: 'thin', color: { auto: 1 } },
        bottom: { style: 'thin', color: { auto: 1 } },
        left: { style: 'thin', color: { auto: 1 } },
        right: { style: 'thin', color: { auto: 1 } },
    }
};

const subHeaderStyle = {
    font: { bold: true, sz: 12 },
    fill: { fgColor: { rgb: "FFD9D9D9" } } // Light Grey
};

const totalStyle = {
    font: { bold: true },
    alignment: { horizontal: 'right' }
};

const addStyledRow = (ws: XLSX.WorkSheet, data: any[], rowIndex: number, style: any, startCol: number = 0) => {
    data.forEach((value, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: startCol + colIndex });
        ws[cellAddress] = { v: value, s: style };
    });
};

const addDataWithAutoWidth = (ws: XLSX.WorkSheet, data: any[][], startRow: number = 0) => {
    XLSX.utils.sheet_add_aoa(ws, data, { origin: `A${startRow + 1}` });
    const colWidths = data[0]?.map((_, i) => ({
        wch: data.reduce((w, r) => Math.max(w, r[i] ? r[i].toString().length : 0), 10)
    })) || [];
    ws['!cols'] = colWidths;
};


export const exportToXlsx = async (
    rooms: Room[],
    clientDetails: ClientDetails,
    margin: number,
) => {
    const wb = XLSX.utils.book_new();
    const rates = await getExchangeRates();
    const inrRate = rates['INR'] || 83.5; // Fallback rate
    const gstRate = 0.18; // 18% total GST
    const sgstRate = gstRate / 2;
    const cgstRate = gstRate / 2;
    
    // --- Proposal Summary Sheet ---
    const summaryWs = XLSX.utils.aoa_to_sheet([[]]); // Start with an empty sheet
    const summaryHeader = ['Sr. No', 'Description', 'Total (INR)'];
    addStyledRow(summaryWs, summaryHeader, 0, headerStyle);
    let summaryRowIndex = 1;
    let projectGrandTotal = 0;

    rooms.forEach((room, index) => {
        if (room.boq) {
            let roomTotalAfterMargin = 0;
            room.boq.forEach(item => {
                const itemMarginPercent = typeof item.margin === 'number' ? item.margin : margin;
                const itemMarginMultiplier = 1 + itemMarginPercent / 100;
                roomTotalAfterMargin += (item.totalPrice * inrRate) * itemMarginMultiplier;
            });
            const roomFinalTotal = roomTotalAfterMargin * (1 + gstRate);
            projectGrandTotal += roomFinalTotal;
            XLSX.utils.sheet_add_aoa(summaryWs, [[index + 1, room.name, roomFinalTotal.toFixed(2)]], { origin: `A${summaryRowIndex + 1}`});
            summaryRowIndex++;
        }
    });
    
    XLSX.utils.sheet_add_aoa(summaryWs, [['', {t: 's', v: 'Grand Total', s: totalStyle}, {t: 'n', v: projectGrandTotal, z: '0.00', s: totalStyle}]], { origin: `B${summaryRowIndex + 2}`});
    summaryWs['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Proposal Summary');


    // --- Contact Details Sheet ---
    const contactWs = XLSX.utils.aoa_to_sheet([[]]);
    let contactRowIndex = 0;

    const projectData = [
        ['Design Engineer', clientDetails.designEngineer || ''],
        ['Date', clientDetails.date || ''],
        ['Prepared By', clientDetails.preparedBy || ''],
        ['Project Name', clientDetails.projectName || ''],
    ];
    XLSX.utils.sheet_add_aoa(contactWs, projectData, { origin: `A${contactRowIndex + 1}`});
    contactRowIndex += projectData.length + 1; // Add spacer

    addStyledRow(contactWs, ['Contact Details'], contactRowIndex, subHeaderStyle);
    contactRowIndex++;

    const clientData = [
        ['Account Manager', clientDetails.accountManager || ''],
        ['Client Name', clientDetails.clientName || ''],
        ['Key Client Personnel', clientDetails.keyClientPersonnel || ''],
        ['Location', clientDetails.location || ''],
        ['Key Comments for this version', clientDetails.keyComments || ''],
    ];
    XLSX.utils.sheet_add_aoa(contactWs, clientData, { origin: `A${contactRowIndex + 1}` });

    contactWs['!cols'] = [{ wch: 30 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, contactWs, 'Contact Details');

    
    // --- Commercial Terms Sheet ---
    const termsWs = XLSX.utils.aoa_to_sheet([]);
    let termsRowIndex = 0;
    Object.entries(companyTemplate.commercialTerms).forEach(([title, data]) => {
        XLSX.utils.sheet_add_aoa(termsWs, [[]], { origin: `A${termsRowIndex + 1}`}); // Spacer
        termsRowIndex++;
        addStyledRow(termsWs, [title], termsRowIndex, subHeaderStyle, 0);
        termsRowIndex++;
        if (data.length > 0) {
            addStyledRow(termsWs, data[0], termsRowIndex, headerStyle, 0);
            termsRowIndex++;
            XLSX.utils.sheet_add_aoa(termsWs, data.slice(1), { origin: `A${termsRowIndex + 1}` });
            termsRowIndex += data.length - 1;
        }
    });
    termsWs['!cols'] = [{ wch: 10 }, { wch: 100 }];
    XLSX.utils.book_append_sheet(wb, termsWs, 'Commercial Terms');


    // --- Individual Room Sheets ---
    rooms.forEach(room => {
        if (room.boq) {
            const roomWs = XLSX.utils.aoa_to_sheet([]);
            const roomHeader = ['Sr. No.', 'Description of Goods / Services', 'Specifications', 'Make', 'Qty.', 'Unit Rate (INR)', 'Total (INR)', 'Margin (%)', 'Total after Margin (INR)', 'SGST 9% (INR)', 'CGST 9% (INR)', 'Total with Tax (INR)'];
            addStyledRow(roomWs, roomHeader, 0, headerStyle);
            
            let roomSubTotal = 0;
            let roomTotalAfterMargin = 0;
            let roomSgstTotal = 0;
            let roomCgstTotal = 0;
            let roomGrandTotal = 0;

            room.boq.forEach((item, index) => {
                const unitPriceInr = item.unitPrice * inrRate;
                const totalPriceInr = item.totalPrice * inrRate;
                
                const currentItemMarginPercent = typeof item.margin === 'number' ? item.margin : margin;
                const marginMultiplier = 1 + currentItemMarginPercent / 100;
                const totalPriceWithMargin = totalPriceInr * marginMultiplier;

                const sgstAmount = totalPriceWithMargin * sgstRate;
                const cgstAmount = totalPriceWithMargin * cgstRate;
                const finalTotalPrice = totalPriceWithMargin + sgstAmount + cgstAmount;

                roomSubTotal += totalPriceInr;
                roomTotalAfterMargin += totalPriceWithMargin;
                roomSgstTotal += sgstAmount;
                roomCgstTotal += cgstAmount;
                roomGrandTotal += finalTotalPrice;

                const rowData = [
                    index + 1,
                    item.itemDescription,
                    item.model,
                    item.brand,
                    item.quantity,
                    unitPriceInr,
                    totalPriceInr,
                    currentItemMarginPercent,
                    totalPriceWithMargin,
                    sgstAmount,
                    cgstAmount,
                    finalTotalPrice
                ];
                XLSX.utils.sheet_add_aoa(roomWs, [rowData], { origin: `A${index + 2}` });
            });
            
            // Add Totals
            const totalRowStart = room.boq.length + 3;
            const totalsData = [
                ['Subtotal:', roomSubTotal],
                ['Total after Margin:', roomTotalAfterMargin],
                ['Total SGST (9%):', roomSgstTotal],
                ['Total CGST (9%):', roomCgstTotal],
                ['Grand Total:', roomGrandTotal]
            ];
            totalsData.forEach((data, i) => {
                 XLSX.utils.sheet_add_aoa(roomWs, [[{t: 's', v: data[0], s: totalStyle}, {t:'n', v: data[1], z: '0.00', s: totalStyle}]], { origin: `H${totalRowStart + i}`});
            });


            roomWs['!cols'] = [
                { wch: 8 }, { wch: 40 }, { wch: 25 }, { wch: 20 }, { wch: 8 }, 
                { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, 
                { wch: 15 }, { wch: 20 }
            ];
            XLSX.utils.book_append_sheet(wb, roomWs, room.name.substring(0, 31));
        }
    });

    XLSX.writeFile(wb, `${clientDetails.projectName || 'BOQ'}_${new Date().toISOString().split('T')[0]}.xlsx`);
};