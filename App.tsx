import React, { useState, useCallback } from 'react';

import Header from './components/Header';
import ClientDetails from './components/ClientDetails';
import Questionnaire from './components/Questionnaire';
import BoqDisplay from './components/BoqDisplay';
import RoomCard from './components/RoomCard';
import TabButton from './components/TabButton';
import ConfirmModal from './components/ConfirmModal';

import { Boq, BoqItem, ClientDetails as ClientDetailsType, Room } from './types';
import { generateBoq, refineBoq, generateRoomVisualization } from './services/geminiService';
import { exportToXlsx } from './utils/exportToXlsx';
import SparklesIcon from './components/icons/SparklesIcon';
import AuthGate from './components/AuthGate';
import LoaderIcon from './components/icons/LoaderIcon';
import SaveIcon from './components/icons/SaveIcon';
import LoadIcon from './components/icons/LoadIcon';

type ActiveTab = 'details' | 'rooms';

const App: React.FC = () => {
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
  const [margin, setMargin] = useState<number>(0);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  const activeRoom = rooms.find(room => room.id === activeRoomId);

  const addRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 9);
    const newRoom: Room = {
      id: newRoomId,
      name: `Room ${rooms.length + 1}`,
      answers: {},
      boq: null,
      isLoading: false,
      error: null,
      isVisualizing: false,
      visualizationImageUrl: null,
      visualizationError: null,
    };
    setRooms([...rooms, newRoom]);
    setActiveRoomId(newRoomId);
    setActiveTab('rooms');
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
        room.id === activeRoomId ? { ...room, answers } : room
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

    setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, isLoading: true, error: null } : r));

    try {
      const requirements = answersToRequirements(activeRoom.answers);
      if (!requirements) {
        throw new Error("Please fill out the questionnaire before generating.");
      }
      const newBoq = await generateBoq(requirements);
      setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, boq: newBoq, isLoading: false } : r));
    } catch (error) {
      console.error('Failed to generate BOQ:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, isLoading: false, error: `Failed to generate: ${errorMessage}` } : r));
    }
  };

  const handleRefineBoq = async (refinementPrompt: string) => {
    if (!activeRoom) return;

    const currentBoq = activeRoom.boq || [];
    setIsRefining(true);
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
          return { ...room, boq: newBoq };
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
          return { ...room, boq: newBoq };
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
          return { ...room, boq: newBoq };
        }
        return room;
      })
    );
  };
  
  const handleExport = () => {
    if(rooms.some(r => r.boq !== null)) {
      exportToXlsx(rooms, clientDetails, margin);
    } else {
      alert("Please generate at least one BOQ before exporting.");
    }
  };

  const handleSaveProject = () => {
    try {
      const projectState = {
        clientDetails,
        rooms,
        margin,
      };
      localStorage.setItem('genboq_project', JSON.stringify(projectState));
      alert('Project saved successfully!');
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Error saving project. See console for details.');
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
            setActiveRoomId(savedState.rooms.length > 0 ? savedState.rooms[0].id : null);
            setActiveTab('details');
            alert('Project loaded successfully!');
          } else {
            throw new Error('Invalid project data format.');
          }
        } else {
          alert('No saved project found.');
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        alert('Error loading project. The saved data might be corrupted.');
      }
    }
  };


  return (
    <AuthGate>
        <div className="bg-slate-900 text-slate-200 min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center border-b border-slate-700 mb-6 gap-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <TabButton isActive={activeTab === 'details'} onClick={() => setActiveTab('details')}>
                        Project Details
                    </TabButton>
                    <TabButton isActive={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')}>
                        Rooms & BOQs
                    </TabButton>
                </nav>
                <div className="flex items-center gap-4 py-2 sm:py-0">
                    <button
                        onClick={handleSaveProject}
                        className="inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-200 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500"
                    >
                       <SaveIcon /> Save Project
                    </button>
                    <button
                        onClick={handleLoadProject}
                        className="inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-200 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500"
                    >
                        <LoadIcon /> Load Project
                    </button>
                </div>
            </div>

            {activeTab === 'details' && (
                <ClientDetails details={clientDetails} onDetailsChange={setClientDetails} />
            )}

            {activeTab === 'rooms' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1 space-y-4">
                        <h2 className="text-xl font-semibold text-white">Rooms</h2>
                        {rooms.map(room => (
                            <RoomCard 
                                key={room.id}
                                room={room}
                                isActive={room.id === activeRoomId}
                                onSelect={setActiveRoomId}
                                onDelete={handleDeleteRequest}
                                onUpdateName={updateRoomName}
                            />
                        ))}
                        <button onClick={addRoom} className="w-full text-center py-3 px-4 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white hover:border-slate-500 transition-colors">
                            + Add New Room
                        </button>
                    </div>

                    <div className="md:col-span-3">
                        {activeRoom ? (
                            <div className="space-y-6">
                                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                                    <h2 className="text-xl font-semibold text-white mb-4">
                                        Room Configuration: <span className="text-blue-400">{activeRoom.name}</span>
                                    </h2>
                                    <Questionnaire 
                                        onAnswersChange={handleAnswersChange} 
                                        key={activeRoom.id}
                                        initialAnswers={activeRoom.answers}
                                    />
                                     <div className="mt-6 flex justify-end">
                                        <button
                                          onClick={handleGenerateBoq}
                                          disabled={activeRoom.isLoading || Object.keys(activeRoom.answers).length === 0}
                                          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-slate-500 disabled:cursor-not-allowed"
                                        >
                                          {activeRoom.isLoading ? <><LoaderIcon/>Generating...</> : <><SparklesIcon/>{activeRoom.boq ? 'Re-generate BOQ' : 'Generate BOQ'}</>}
                                        </button>
                                    </div>
                                </div>
                                <BoqDisplay 
                                    boq={activeRoom.boq} 
                                    onRefine={handleRefineBoq} 
                                    isRefining={isRefining}
                                    onExport={handleExport}
                                    margin={margin}
                                    onMarginChange={setMargin}
                                    onBoqItemUpdate={handleBoqItemUpdate}
                                    onBoqItemAdd={handleBoqItemAdd}
                                    onBoqItemDelete={handleBoqItemDelete}
                                    onGenerateVisualization={handleGenerateVisualization}
                                    onClearVisualization={handleClearVisualization}
                                    isVisualizing={activeRoom.isVisualizing}
                                    visualizationError={activeRoom.visualizationError}
                                    visualizationImageUrl={activeRoom.visualizationImageUrl}
                                />
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-slate-800 rounded-lg border border-slate-700">
                                <h3 className="text-xl font-semibold">Select a room or add a new one</h3>
                                <p className="text-slate-400 mt-2">Get started by adding a room to your project.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
        <ConfirmModal
            isOpen={isConfirmModalOpen}
            onClose={() => {
                setIsConfirmModalOpen(false);
                setRoomToDelete(null);
            }}
            onConfirm={handleConfirmDelete}
            title="Confirm Room Deletion"
            message={
                <>
                    Are you sure you want to delete the room <strong className="font-semibold text-white">{roomToDelete?.name}</strong>?
                    <br />
                    This action cannot be undone.
                </>
            }
        />
        </div>
    </AuthGate>
  );
};

export default App;