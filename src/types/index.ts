export type StudentPriorityTier = 'high_exam' | 'medical_girl_safety' | 'standard';

export type TransportRequestStatus = 'pending' | 'confirmed' | 'waitlisted' | 'reassigned' | 'rejected';

export type BusStatus = 'active' | 'breakdown' | 'delayed' | 'maintenance' | 'full';

export type RoadCondition = 'good' | 'average' | 'poor' | 'flooded' | 'under_repair';

export type UserRole = 'student' | 'operator' | 'analyst';

export type Language = 'en' | 'kn';

export interface Coordinates {
  x: number; // for SVG / schematic canvas (0 - 1000)
  y: number; // for SVG / schematic canvas (0 - 700)
  lat: number;
  lng: number;
}

export interface Village {
  id: string;
  name: string;
  kannadaName: string;
  taluk: string;
  district: string;
  coordinates: Coordinates;
  studentPopulation: number;
  isRemote: boolean;
  connectivityScore: number; // 1 to 10
  landmark: string;
}

export interface Institution {
  id: string;
  name: string;
  kannadaName: string;
  type: 'polytechnic' | 'engineering' | 'degree_college' | 'high_school';
  coordinates: Coordinates;
  morningOpeningTime: string; // e.g. "09:00 AM"
  eveningClosingTime: string; // e.g. "04:30 PM"
  studentCapacity: number;
  landmark: string;
}

export interface RoadSegment {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distanceKm: number;
  typicalMinutes: number;
  condition: RoadCondition;
  isDisrupted: boolean;
  disruptionReason?: string;
}

export interface Bus {
  id: string;
  busNumber: string;
  operatorName: string; // e.g., "NWKRTC / KSRTC Gramina Sarige"
  operatorType: 'ksrtc_sarige' | 'mini_bus' | 'institution_shuttle' | 'verified_maxicab' | 'panchayat_ev';
  model: string;
  totalCapacity: number;
  occupiedSeats: number;
  routeId: string;
  stops: string[]; // array of node IDs (villages and institutions)
  status: BusStatus;
  currentStopId: string;
  departureTime: string;
  estimatedArrivalTime: string;
  driverName: string;
  driverContact: string;
  isAlternativeProvider?: boolean;
  rating: number; // e.g. 4.8
  fuelType: 'diesel' | 'electric' | 'cng';
}

export interface AlternativeProvider {
  id: string;
  name: string;
  kannadaName: string;
  providerType: 'panchayat_ev_feeder' | 'rural_maxicab' | 'college_rural_feeder';
  vehicleNumber: string;
  totalCapacity: number;
  availableSeats: number;
  farePerStudent: number; // 0 for government subsidized / sponsored, or e.g. 15
  isVerified: boolean;
  licenseNumber: string;
  contactNumber: string;
  operatingVillages: string[];
  destinationInstitutions: string[];
  status: 'active' | 'standby' | 'dispatched';
}

export interface Student {
  id: string;
  name: string;
  kannadaName: string;
  rollNumber: string;
  villageId: string;
  institutionId: string;
  course: string;
  yearOfStudy: string;
  gender: 'female' | 'male' | 'other';
  requiredArrivalTime: string;
  priorityTier: StudentPriorityTier;
  hasBoardExamToday: boolean;
  status: TransportRequestStatus;
  assignedBusId?: string;
  assignedAlternativeId?: string;
  pickupPoint: string;
  contactNumber: string;
  travelDate: string;
}

export interface TransportationRequest {
  id: string;
  studentId: string;
  studentName: string;
  villageId: string;
  villageName: string;
  institutionId: string;
  institutionName: string;
  requestedDepartureTime: string;
  requiredArrivalTime: string;
  travelDate: string;
  priorityScore: number;
  priorityTier: StudentPriorityTier;
  status: TransportRequestStatus;
  assignedVehicleId?: string;
  assignedVehicleType?: string;
  assignedVehicleNumber?: string;
  pickupLocation: string;
  allocationReason: string;
  scoreBreakdown?: {
    routeMatch: number;
    timeMatch: number;
    capacityScore: number;
    priorityBonus: number;
    total: number;
  };
  createdAt: string;
}

export interface DisruptionEvent {
  id: string;
  timestamp: string;
  type: 'bus_breakdown' | 'road_closure' | 'demand_surge' | 'capacity_reduction' | 'extra_bus_added';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedBusId?: string;
  affectedRoadId?: string;
  affectedStudentIds: string[];
  reassignedStudentIds: string[];
  waitlistedStudentIds: string[];
  status: 'active' | 'resolved';
}

export interface RouteOptimizationResult {
  fromNodeId: string;
  toNodeId: string;
  originalPath: string[];
  originalDistanceKm: number;
  originalMinutes: number;
  hasDisruption: boolean;
  alternativePath?: string[];
  alternativeDistanceKm?: number;
  alternativeMinutes?: number;
  detourDistanceKm?: number;
  detourMinutes?: number;
  blockedSegment?: RoadSegment;
  recommendedPickupPoint?: string;
}

export interface SystemNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  targetRole: UserRole | 'all';
  read: boolean;
  linkAction?: string;
}
