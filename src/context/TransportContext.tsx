import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Village,
  Institution,
  RoadSegment,
  Bus,
  AlternativeProvider,
  Student,
  TransportationRequest,
  DisruptionEvent,
  SystemNotification,
  Language,
  BusStatus,
  StudentPriorityTier,
  EmergencyRunReport,
} from '../types';
import {
  INITIAL_VILLAGES,
  INITIAL_INSTITUTIONS,
  INITIAL_ROADS,
  INITIAL_BUSES,
  INITIAL_ALTERNATIVE_PROVIDERS,
  INITIAL_STUDENTS,
  INITIAL_REQUESTS,
  INITIAL_DISRUPTIONS,
} from '../data/demoData';
import { AllocationEngine, AllocationDecision } from '../algorithms/allocationEngine';
import { DisruptionEngine, DisruptionSimulationResult } from '../algorithms/disruptionEngine';
import { EmergencyOptimizer } from '../algorithms/emergencyOptimizer';
import { authenticateDemo, AuthenticatedDemoAccount, DEMO_ACCOUNTS } from '../auth/demoAuth';
import { en } from '../locales/en';
import { kn } from '../locales/kn';

interface TransportContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof en;
  activeRole: string;
  setActiveRole: (role: string) => void;
  demoAccount: AuthenticatedDemoAccount | null;
  loginDemo: (email: string, password: string) => boolean;
  logoutDemo: () => void;
  completeStudentSetup: () => void;
  activeStudentId: string;
  setActiveStudentId: (id: string) => void;
  activeStudent: Student;
  villages: Village[];
  institutions: Institution[];
  roads: RoadSegment[];
  buses: Bus[];
  alternatives: AlternativeProvider[];
  students: Student[];
  requests: TransportationRequest[];
  disruptions: DisruptionEvent[];
  notifications: SystemNotification[];
  isRuralLite: boolean;
  toggleRuralLite: () => void;
  latestImpactReport: DisruptionSimulationResult['impactReport'] | null;
  emergencyReport: EmergencyRunReport | null;
  clearImpactReport: () => void;

  // Actions
  submitRideRequest: (params: {
    studentId: string;
    villageId: string;
    institutionId: string;
    departureTime: string;
    arrivalTime: string;
    travelDate: string;
    priorityTier: StudentPriorityTier;
    hasBoardExamToday: boolean;
    examinationStartTime?: string;
    preferredAlternativeId?: string;
  }) => AllocationDecision;

  simulateBusBreakdown: (busId: string) => void;
  simulateRoadClosure: (roadId: string, reason?: string) => void;
  simulateDemandSurge: () => void;
  activateExamDayCrisis: () => void;
  resetExamDayCrisis: () => void;
  addAuxiliaryBus: (busData: Omit<Bus, 'id' | 'occupiedSeats' | 'status'>) => void;
  updateBusStatus: (busId: string, status: BusStatus) => void;
  toggleRoadStatus: (roadId: string) => void;
  dismissNotification: (id: string) => void;
  resetDemoData: () => void;
}

const TransportContext = createContext<TransportContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'routeless_transport_state_v1';
const SESSION_STORAGE_KEY = 'routeless_demo_session_v1';
const STUDENT_SETUP_KEY = 'routeless_student_setup_v1';

const readSavedDemoAccount = (): AuthenticatedDemoAccount | null => {
  try {
    const account = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!account) return null;
    const parsed = JSON.parse(account) as AuthenticatedDemoAccount;
    const known = DEMO_ACCOUNTS.find((candidate) => candidate.id === parsed.id && candidate.role === parsed.role);
    return known ? { id: known.id, email: known.email, role: known.role, displayName: known.displayName } : null;
  } catch {
    return null;
  }
};

const savedAccount = readSavedDemoAccount();
const hasCompletedStudentSetup = () => {
  try { return localStorage.getItem(STUDENT_SETUP_KEY) === 'true'; } catch { return false; }
};
const initialRole = savedAccount?.role === 'operator' ? 'operator' : savedAccount?.role === 'student'
  ? hasCompletedStudentSetup() ? 'student' : 'student_setup'
  : 'login';

export const TransportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [activeRole, setActiveRole] = useState<string>(initialRole);
  const [demoAccount, setDemoAccount] = useState<AuthenticatedDemoAccount | null>(savedAccount);
  const [activeStudentId, setActiveStudentId] = useState<string>('std_01');
  const [isRuralLite, setIsRuralLite] = useState<boolean>(false);
  const [latestImpactReport, setLatestImpactReport] = useState<DisruptionSimulationResult['impactReport'] | null>(null);
  const [emergencyReport, setEmergencyReport] = useState<EmergencyRunReport | null>(null);
  const emergencyLock = useRef(false);

  // Core State
  const [villages, setVillages] = useState<Village[]>(INITIAL_VILLAGES);
  const [institutions, setInstitutions] = useState<Institution[]>(INITIAL_INSTITUTIONS);
  const [roads, setRoads] = useState<RoadSegment[]>(INITIAL_ROADS);
  const [buses, setBuses] = useState<Bus[]>(INITIAL_BUSES);
  const [alternatives, setAlternatives] = useState<AlternativeProvider[]>(INITIAL_ALTERNATIVE_PROVIDERS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [requests, setRequests] = useState<TransportationRequest[]>(INITIAL_REQUESTS);
  const [disruptions, setDisruptions] = useState<DisruptionEvent[]>(INITIAL_DISRUPTIONS);
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'notif_welcome',
      timestamp: new Date().toISOString(),
      title: '🚌 Routeless AI Network Online',
      message: 'Monitoring rural transit corridors across Belagavi district. Government buses, Panchayat feeders, and alternative fleets synchronized.',
      type: 'info',
      targetRole: 'all',
      read: false,
    },
    {
      id: 'notif_init_road',
      timestamp: new Date().toISOString(),
      title: '⚠️ Canal Bridge Subsidence Alert',
      message: 'Direct highway segment between Harugeri & Polytechnic closed for culvert repair. Route optimization active.',
      type: 'warning',
      targetRole: 'all',
      read: false,
    },
  ]);

  // Load from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.villages) setVillages(parsed.villages);
        if (parsed.institutions) setInstitutions(parsed.institutions);
        if (parsed.roads) setRoads(parsed.roads);
        if (parsed.buses) setBuses(parsed.buses);
        if (parsed.alternatives) setAlternatives(parsed.alternatives);
        if (parsed.students) setStudents(parsed.students);
        if (parsed.requests) setRequests(parsed.requests);
        if (parsed.disruptions) setDisruptions(parsed.disruptions);
        if (parsed.activeStudentId && savedAccount?.role !== 'student') setActiveStudentId(parsed.activeStudentId);
        if (parsed.emergencyReport) { setEmergencyReport(parsed.emergencyReport); emergencyLock.current = true; }
      }
    } catch (e) {
      console.warn('Failed to parse saved state from localStorage:', e);
    }
  }, []);

  // Save state on updates
  useEffect(() => {
    try {
      const stateToSave = {
        villages,
        institutions,
        roads,
        buses,
        alternatives,
        students,
        requests,
        disruptions,
        activeStudentId,
        emergencyReport,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }, [villages, institutions, roads, buses, alternatives, students, requests, disruptions, activeStudentId, emergencyReport]);

  const activeStudent = students.find((s) => s.id === activeStudentId) || students[0];
  const t = language === 'kn' ? kn : en;

  const loginDemo = (email: string, password: string) => {
    const account = authenticateDemo(email, password);
    if (!account) return false;
    try { localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(account)); } catch { /* Keep the current in-memory demo session. */ }
    setDemoAccount(account);
    if (account.role === 'student') {
      setActiveStudentId('std_01');
      setActiveRole(hasCompletedStudentSetup() ? 'student' : 'student_setup');
    } else {
      setActiveRole('operator');
    }
    return true;
  };

  const logoutDemo = () => {
    try { localStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* Sign out in memory even if storage is unavailable. */ }
    setDemoAccount(null);
    setActiveRole('login');
  };

  const completeStudentSetup = () => {
    try { localStorage.setItem(STUDENT_SETUP_KEY, 'true'); } catch { /* Keep setup completion for this session. */ }
    setActiveRole('student');
  };

  // 1. Submit Ride Request
  const submitRideRequest = (params: {
    studentId: string;
    villageId: string;
    institutionId: string;
    departureTime: string;
    arrivalTime: string;
    travelDate: string;
    priorityTier: StudentPriorityTier;
    hasBoardExamToday: boolean;
    examinationStartTime?: string;
    preferredAlternativeId?: string;
  }): AllocationDecision => {
    const student = students.find((s) => s.id === params.studentId) || activeStudent;
    const village = villages.find((v) => v.id === params.villageId);
    const inst = institutions.find((i) => i.id === params.institutionId);

    const updatedStudent: Student = {
      ...student,
      villageId: params.villageId,
      institutionId: params.institutionId,
      requiredArrivalTime: params.arrivalTime,
      priorityTier: params.priorityTier,
      hasBoardExamToday: params.hasBoardExamToday,
      examinationStatus: params.hasBoardExamToday ? 'scheduled' : 'none',
      examinationStartTime: params.hasBoardExamToday ? params.examinationStartTime || student.examinationStartTime : undefined,
      travelDate: params.travelDate,
      assignedBusId: undefined,
      assignedAlternativeId: undefined,
    };

    const availableBuses = buses.map((bus) => bus.id === student.assignedBusId
      ? { ...bus, occupiedSeats: Math.max(0, bus.occupiedSeats - 1) }
      : { ...bus });
    const availableAlternatives = alternatives.map((alternative) => alternative.id === student.assignedAlternativeId
      ? { ...alternative, availableSeats: Math.min(alternative.totalCapacity, alternative.availableSeats + 1) }
      : { ...alternative });
    const decision = AllocationEngine.allocateStudent(updatedStudent, availableBuses, availableAlternatives, villages, params.preferredAlternativeId);
    let nextBuses = availableBuses;
    let nextAlternatives = availableAlternatives;

    // Update Bus or Alternative seat counts
    if (decision.status === 'confirmed') {
      if (decision.assignedBus) {
        nextBuses = availableBuses.map((bus) => bus.id === decision.assignedBus!.id ? { ...bus, occupiedSeats: bus.occupiedSeats + 1 } : bus);
        updatedStudent.assignedBusId = decision.assignedBus.id;
        updatedStudent.status = 'confirmed';
      } else if (decision.assignedAlternative) {
        nextAlternatives = availableAlternatives.map((alternative) => alternative.id === decision.assignedAlternative!.id ? { ...alternative, availableSeats: alternative.availableSeats - 1 } : alternative);
        updatedStudent.assignedAlternativeId = decision.assignedAlternative.id;
        updatedStudent.status = 'confirmed';
      }
    } else {
      updatedStudent.status = 'waitlisted';
    }

    setBuses(nextBuses);
    setAlternatives(nextAlternatives);

    // Save student update
    setStudents((prev) => prev.map((s) => (s.id === student.id ? updatedStudent : s)));

    // Create Request Record
    const newReq: TransportationRequest = {
      id: `req_${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      villageId: params.villageId,
      villageName: village?.name || params.villageId,
      institutionId: params.institutionId,
      institutionName: inst?.name || params.institutionId,
      requestedDepartureTime: params.departureTime,
      requiredArrivalTime: params.arrivalTime,
      travelDate: params.travelDate,
      priorityScore: decision.score,
      priorityTier: params.priorityTier,
      status: decision.status,
      demandSource: 'registered',
      assignedVehicleId: decision.assignedBus?.id || decision.assignedAlternative?.id,
      assignedVehicleNumber: decision.assignedBus?.busNumber || decision.assignedAlternative?.vehicleNumber,
      assignedVehicleType: decision.assignedBus?.operatorName || decision.assignedAlternative?.name,
      pickupLocation: village?.landmark || 'Village Main Circle',
      allocationReason: decision.reason,
      scoreBreakdown: decision.scoreBreakdown,
      createdAt: new Date().toISOString(),
    };

    setRequests((prev) => [newReq, ...prev]);

    // Push Notification
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: decision.status === 'confirmed' ? '✅ Transit Pass Allocated' : '⏳ Request Waitlisted',
        message: decision.reason,
        type: decision.status === 'confirmed' ? 'success' : 'warning',
        targetRole: 'student',
        read: false,
      },
      ...prev,
    ]);

    return decision;
  };

  // 2. Simulate Bus Breakdown
  const simulateBusBreakdown = (busId: string) => {
    try {
      const result = DisruptionEngine.simulateBusBreakdown(
        busId,
        buses,
        alternatives,
        students,
        requests,
        roads,
        villages,
        institutions
      );

      setBuses(result.updatedBuses);
      setAlternatives(result.updatedAlternatives);
      setStudents(result.updatedStudents);
      setRequests(result.updatedRequests);
      setDisruptions((prev) => [result.disruptionEvent, ...prev]);
      setNotifications((prev) => [...result.notifications, ...prev]);
      setLatestImpactReport(result.impactReport);
    } catch (e) {
      console.error('Error simulating bus breakdown:', e);
    }
  };

  // 3. Simulate Road Closure
  const simulateRoadClosure = (roadId: string, reason?: string) => {
    const defaultReason = reason || 'Canal Flash Flood / Culvert Repair';
    const result = DisruptionEngine.simulateRoadClosure(
      roadId,
      defaultReason,
      roads,
      buses,
      villages,
      institutions
    );

    setRoads(result.updatedRoads);
    setBuses(result.updatedBuses);
    setDisruptions((prev) => [result.disruptionEvent, ...prev]);
    setNotifications((prev) => [...result.notifications, ...prev]);
  };

  // 4. Simulate Sudden Demand Surge
  const simulateDemandSurge = () => {
    const result = DisruptionEngine.simulateDemandSurge(
      students,
      requests,
      buses,
      alternatives,
      villages,
      institutions
    );

    setStudents((prev) => [...prev, ...result.newStudents]);
    setRequests((prev) => [...result.newRequests, ...prev]);
    setBuses(result.updatedBuses);
    setAlternatives(result.updatedAlternatives);
    setNotifications((prev) => [...result.notifications, ...prev]);
  };

  const activateExamDayCrisis = () => {
    if (emergencyLock.current || emergencyReport) return;
    emergencyLock.current = true;
    try {
      const result = EmergencyOptimizer.activate({ buses, alternatives, roads, students, requests, villages, institutions });
      setBuses(result.buses);
      setAlternatives(result.alternatives);
      setRoads(result.roads);
      setStudents(result.students);
      setRequests(result.requests);
      setDisruptions((previous) => [result.event, ...previous]);
      setNotifications((previous) => [...result.notifications, ...previous]);
      setEmergencyReport(result.report);
      setLatestImpactReport(null);
    } catch (error) {
      emergencyLock.current = false;
      console.error('Unable to activate the Exam Day Crisis simulation:', error);
    }
  };

  const resetExamDayCrisis = () => resetDemoData();

  // 5. Add Auxiliary Bus
  const addAuxiliaryBus = (busData: Omit<Bus, 'id' | 'occupiedSeats' | 'status'>) => {
    const result = DisruptionEngine.addAuxiliaryBus(
      busData,
      buses,
      students,
      requests,
      villages,
      institutions
    );

    setBuses(result.updatedBuses);
    setStudents(result.updatedStudents);
    setRequests(result.updatedRequests);
    setNotifications((prev) => [...result.notifications, ...prev]);
  };

  // 6. Update Bus Status
  const updateBusStatus = (busId: string, status: BusStatus) => {
    if (status === 'breakdown') {
      simulateBusBreakdown(busId);
      return;
    }

    setBuses((prev) =>
      prev.map((b) => (b.id === busId ? { ...b, status } : b))
    );
  };

  // 7. Toggle Road Segment Disrupted/Clear
  const toggleRoadStatus = (roadId: string) => {
    setRoads((prev) =>
      prev.map((r) => {
        if (r.id === roadId) {
          const nextDisrupted = !r.isDisrupted;
          return {
            ...r,
            isDisrupted: nextDisrupted,
            condition: nextDisrupted ? 'under_repair' : 'good',
            disruptionReason: nextDisrupted ? 'Active Construction Detour' : undefined,
          };
        }
        return r;
      })
    );
  };

  // 8. Dismiss Notification
  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // 9. Reset Demo Data
  const resetDemoData = () => {
    emergencyLock.current = false;
    setEmergencyReport(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setVillages(INITIAL_VILLAGES);
    setInstitutions(INITIAL_INSTITUTIONS);
    setRoads(INITIAL_ROADS);
    setBuses(INITIAL_BUSES);
    setAlternatives(INITIAL_ALTERNATIVE_PROVIDERS);
    setStudents(INITIAL_STUDENTS);
    setRequests(INITIAL_REQUESTS);
    setDisruptions(INITIAL_DISRUPTIONS);
    setActiveStudentId('std_01');
    setLatestImpactReport(null);
    setNotifications([
      {
        id: `notif_reset_${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: '🔄 Demo Dataset Restored',
        message: 'All rural routes, bus seat capacities, and student allocations have been reset to default benchmark scenario.',
        type: 'info',
        targetRole: 'all',
        read: false,
      },
    ]);
  };

  const toggleRuralLite = () => {
    setIsRuralLite((prev) => !prev);
  };

  const clearImpactReport = () => {
    setLatestImpactReport(null);
  };

  return (
    <TransportContext.Provider
      value={{
        language,
        setLanguage,
        t,
        activeRole,
        setActiveRole,
        demoAccount,
        loginDemo,
        logoutDemo,
        completeStudentSetup,
        activeStudentId,
        setActiveStudentId,
        activeStudent,
        villages,
        institutions,
        roads,
        buses,
        alternatives,
        students,
        requests,
        disruptions,
        notifications,
        isRuralLite,
        toggleRuralLite,
        latestImpactReport,
        emergencyReport,
        clearImpactReport,
        submitRideRequest,
        simulateBusBreakdown,
        simulateRoadClosure,
        simulateDemandSurge,
        activateExamDayCrisis,
        resetExamDayCrisis,
        addAuxiliaryBus,
        updateBusStatus,
        toggleRoadStatus,
        dismissNotification,
        resetDemoData,
      }}
    >
      {children}
    </TransportContext.Provider>
  );
};

export const useTransport = () => {
  const context = useContext(TransportContext);
  if (!context) {
    throw new Error('useTransport must be used within a TransportProvider');
  }
  return context;
};
