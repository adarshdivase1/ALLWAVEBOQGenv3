import React, { useState, useCallback, useEffect } from 'react';

import Header from './components/Header';
import ClientDetails from './components/ClientDetails';
import Questionnaire from './components/Questionnaire';
import BoqDisplay from './components/BoqDisplay';
import RoomCard from './components/RoomCard';
import TabButton from './components/TabButton';
import ConfirmModal from './components/ConfirmModal';
import AddRoomModal from './components/AddRoomModal';
import CompareModal from './components/CompareModal';
import Toast from './components/Toast';
import BrandingModal from './components/BrandingModal';
import PrintHeader from './components/PrintHeader';

import { BoqItem, ClientDetails as ClientDetailsType, Room, Toast as ToastType, Theme, BrandingSettings } from './types';
import { generateBoq, refineBoq, generateRoomVisualization, validateBoq } from './services/geminiService';
import { exportToXlsx } from './utils/exportToXlsx';
import SparklesIcon from './components/icons/SparklesIcon';
import AuthGate from './components/AuthGate';
import LoaderIcon from './components/icons/LoaderIcon';
import SaveIcon from './components/icons/SaveIcon';
import LoadIcon from './components/icons/LoadIcon';
import CompareIcon from './components/icons/CompareIcon';
import DownloadIcon from './components/icons/DownloadIcon';

type ActiveTab = 'details' | 'rooms';

const defaultBranding: BrandingSettings = {
  logoUrl: '',
  primaryColor: '#92D050', // Default green
  companyInfo: {
    name: 'Your Company Name',
    address: '123 Main Street, Suite 100, Anytown, USA 12345',
    phone: '555-123-4567',
    email: 'contact@yourcompany.com',
    website: 'www.yourcompany.com',
  },
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clientDetails, setClientDetails] = useState<ClientDetailsType>({
    clientName: '',
    projectName: '',
    preparedBy: '',
    date: new Date().toISOString().split('T')[0],
    designEngineer: '',
    accountManager: '',
    keyClientPersonnel: '',
    location: '',
    keyComments: '',
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('details');
  const [isRefining, setIsRefining] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [margin, setMargin] = useState<number>(0);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [toast, setToast] = useState<ToastType | null>(null);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>(defaultBranding);

  const activeRoom = rooms.find(room => room.id === activeRoomId);

  // --- Theme Management ---
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            handleSaveProject();
            break;
          case 'e':
            event.preventDefault();
            handleExport();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [rooms, clientDetails, margin, brandingSettings]); 

  // --- Toast Timeout ---
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleAddRoom = (templateAnswers: Record<string, any> = {}, templateName?: string) => {
    const newRoomId = Math.random().toString(36).substring(2, 9);
    const newRoom: Room = {
      id: newRoomId,
      name: templateName ? templateName : `Room ${rooms.length + 1}`,
      answers: templateAnswers,
      boq: null,
      isLoading: false,
      error: null,
      isVisualizing: false,
      visualizationImageUrl: null,
      visualizationError: null,
      isValidating: false,
      validationResult: null,
    };
    setRooms([...rooms, newRoom]);
    setActiveRoomId(newRoomId);
    setActiveTab('rooms');
    setIsAddRoomModalOpen(false); // Close modal after adding
  };
  
  const handleDuplicateRoom = (id: string) => {
    const roomToDuplicate = rooms.find(room => room.id === id);
    if (!roomToDuplicate) return;

    const newRoom: Room = JSON.parse(JSON.stringify(roomToDuplicate));

    newRoom.id = Math.random().toString(36).substring(2, 9);
    newRoom.name = `${roomToDuplicate.name} (Copy)`;
    newRoom.isValidating = false;
    newRoom.validationResult = null; // Reset validation on copy
    
    const originalRoomIndex = rooms.findIndex(room => room.id === id);

    const updatedRooms = [
      ...rooms.slice(0, originalRoomIndex + 1),
      newRoom,
      ...rooms.slice(originalRoomIndex + 1),
    ];

    setRooms(updatedRooms);
    setActiveRoomId(newRoom.id);
  };

  const handleDeleteRequest = (id: string) => {
    const room = rooms.find(r => r.id === id);
    if (room) {
        setRoomToDelete(room);
        setIsConfirmModalOpen(true);
    }
  };

  const handleConfirmDelete = () => {
      if (!roomToDelete) return;

      const newRooms = rooms.filter(room => room.id !== roomToDelete.id);
      setRooms(newRooms);
      if (activeRoomId === roomToDelete.id) {
          setActiveRoomId(newRooms.length > 0 ? newRooms[0].id : null);
      }
      setIsConfirmModalOpen(false);
      setRoomToDelete(null);
  };
  
  const updateRoomName = (id: string, newName: string) => {
    setRooms(rooms.map(room => room.id === id ? { ...room, name: newName } : room));
  };
  
  const handleAnswersChange = useCallback((answers: Record<string, any>) => {
    if (!activeRoomId) return;
    setRooms(prevRooms =>
      prevRooms.map(room =>
        room.id === activeRoomId ? { ...room, answers, validationResult: null } : room // Clear validation on change
      )
    );
  }, [activeRoomId]);

  const answersToRequirements = (answers: Record<string, any>): string => {
    return Object.entries(answers)
      .map(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          return `${key}: ${value.join(', ')}`;
        }
        if (value) {
            return `${key}: ${value}`;
        }
        return null;
      })
      .filter(Boolean)
      .join('; ');
  };

  const handleGenerateBoq = async () => {
    if (!activeRoom) return;

    setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, isLoading: true, isValidating: false, validationResult: null, error: null } : r));

    try {
      const requirements = answersToRequirements(activeRoom.answers);
      if (!requirements) {
        throw new Error("Please fill out the questionnaire before generating.");
      }
      const newBoq = await generateBoq(requirements);
      
      setRooms(prevRooms => prevRooms.map(r => r.id === activeRoomId ? { ...r, boq: newBoq, isLoading: false, isValidating: true } : r));

      const validation = await validateBoq(newBoq, requirements);

      setRooms(prevRooms => prevRooms.map(r => r.id === activeRoomId ? { ...r, isValidating: false, validationResult: validation } : r));

    } catch (error) {
      console.error('Failed to generate or validate BOQ:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, isLoading: false, isValidating: false, error: `Operation failed: ${errorMessage}` } : r));
    }
  };

  const handleRefineBoq = async (refinementPrompt: string) => {
    if (!activeRoom) return;

    const currentBoq = activeRoom.boq || [];
    setIsRefining(true);
    setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, validationResult: null } : r));
    try {
        const refinedBoq = await refineBoq(currentBoq, refinementPrompt);
        setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, boq: refinedBoq, error: null } : r));
    } catch (error) {
        console.error('Failed to refine BOQ:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, error: `Failed to refine: ${errorMessage}` } : r));
    } finally {
        setIsRefining(false);
    }
  };

  const handleGenerateVisualization = async () => {
    if (!activeRoom || !activeRoom.boq) return;

    setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, isVisualizing: true, visualizationError: null, visualizationImageUrl: null } : r));

    try {
      const imageUrl = await generateRoomVisualization(activeRoom.answers, activeRoom.boq);
      setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, visualizationImageUrl: imageUrl, isVisualizing: false } : r));
    } catch (error) {
      console.error('Failed to generate visualization:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, isVisualizing: false, visualizationError: `Failed to generate visualization: ${errorMessage}` } : r));
    }
  };

  const handleClearVisualization = () => {
    if (!activeRoomId) return;
    setRooms(prevRooms =>
      prevRooms.map(room =>
        room.id === activeRoomId ? { ...room, visualizationImageUrl: null, visualizationError: null } : room
      )
    );
  };

  const handleBoqItemUpdate = (itemIndex: number, updatedValues: Partial<BoqItem>) => {
    if (!activeRoomId) return;
    setRooms(prevRooms =>
      prevRooms.map(room => {
        if (room.id === activeRoomId && room.boq) {
          const newBoq = [...room.boq];
          if (updatedValues.margin !== undefined && updatedValues.margin < 0) {
            updatedValues.margin = 0;
          }
          newBoq[itemIndex] = { ...newBoq[itemIndex], ...updatedValues };
          return { ...room, boq: newBoq, validationResult: null };
        }
        return room;
      })
    );
  };

  const handleBoqItemDelete = (itemIndex: number) => {
    if (!activeRoomId) return;
    setRooms(prevRooms =>
      prevRooms.map(room => {
        if (room.id === activeRoomId && room.boq) {
          const newBoq = room.boq.filter((_, index) => index !== itemIndex);
          return { ...room, boq: newBoq, validationResult: null };
        }
        return room;
      })
    );
  };

  const handleBoqItemAdd = () => {
    if (!activeRoomId) return;
    const newItem: BoqItem = {
      category: '',
      itemDescription: 'New Item',
      brand: '',
      model: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setRooms(prevRooms =>
      prevRooms.map(room => {
        if (room.id === activeRoomId) {
          const currentBoq = room.boq || [];
          const newBoq = [...currentBoq, newItem];
          return { ...room, boq: newBoq, validationResult: null };
        }
        return room;
      })
    );
  };
  
  const handleExport = async () => {
    if (rooms.some(r => r.boq !== null)) {
      setIsExporting(true);
      setToast({ message: 'Generating Excel file...', type: 'success' });
      try {
        await exportToXlsx(rooms, clientDetails, margin, brandingSettings);
        setToast({ message: 'BOQ exported successfully!', type: 'success' });
      } catch (error) {
        console.error("Export failed:", error);
        setToast({ message: 'Failed to export BOQ.', type: 'error' });
      } finally {
        setIsExporting(false);
      }
    } else {
      setToast({ message: 'Please generate at least one BOQ before exporting.', type: 'error' });
    }
  };

  const handleSaveProject = () => {
    try {
      const projectState = {
        clientDetails,
        rooms,
        margin,
        brandingSettings,
      };
      localStorage.setItem('genboq_project', JSON.stringify(projectState));
      setToast({ message: 'Project saved successfully!', type: 'success' });
    } catch (error) {
      console.error('Failed to save project:', error);
      setToast({ message: 'Error saving project.', type: 'error' });
    }
  };

  const handleLoadProject = () => {
    if (window.confirm('Are you sure you want to load a project? Any unsaved changes will be lost.')) {
      try {
        const savedStateJSON = localStorage.getItem('genboq_project');
        if (savedStateJSON) {
          const savedState = JSON.parse(savedStateJSON);
          if (savedState.clientDetails && Array.isArray(savedState.rooms)) {
            setClientDetails(savedState.clientDetails);
            setRooms(savedState.rooms);
            setMargin(savedState.margin || 0);
            setBrandingSettings(savedState.brandingSettings || defaultBranding);
            setActiveRoomId(savedState.rooms.length > 0 ? savedState.rooms[0].id : null);
            setActiveTab('details');
            setToast({ message: 'Project loaded successfully!', type: 'success' });
          } else {
            throw new Error('Invalid project data format.');
          }
        } else {
          setToast({ message: 'No saved project found.', type: 'error' });
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        setToast({ message: 'Error loading project. Data might be corrupted.', type: 'error' });
      }
    }
  };

  const canExport = rooms.some(r => r.boq && r.boq.