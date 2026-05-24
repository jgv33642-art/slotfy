export interface Tenant {
  id: string;
  name: string;
  slug: string;
  niche: string;
  business_hours: {
    [key: string]: { open: string; close: string; active: boolean };
  };
  whatsapp_number: string;
  subscription_status: 'active' | 'inactive' | 'past_due';
}

export interface Profile {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  appointment_time: string; // ISO date string
  status: 'scheduled' | 'confirmed' | 'cancelled';
  notes?: string;
  created_at: string;
}

const DEFAULT_BUSINESS_HOURS = {
  monday: { open: "08:00", close: "18:00", active: true },
  tuesday: { open: "08:00", close: "18:00", active: true },
  wednesday: { open: "08:00", close: "18:00", active: true },
  thursday: { open: "08:00", close: "18:00", active: true },
  friday: { open: "08:00", close: "18:00", active: true },
  saturday: { open: "08:00", close: "12:00", active: true },
  sunday: { open: "00:00", close: "00:00", active: false }
};

const MOCK_TENANTS: Tenant[] = [
  {
    id: 't-1',
    name: 'Barbearia Vintage & Navalha',
    slug: 'barbearia-vintage',
    niche: 'Beleza e Estética',
    business_hours: DEFAULT_BUSINESS_HOURS,
    whatsapp_number: '+5511999999999',
    subscription_status: 'active'
  },
  {
    id: 't-2',
    name: 'Clínica Sorriso Saudável',
    slug: 'sorriso-saudavel',
    niche: 'Saúde e Odontologia',
    business_hours: {
      ...DEFAULT_BUSINESS_HOURS,
      saturday: { open: "08:00", close: "12:00", active: false } // closed on Saturdays too
    },
    whatsapp_number: '+5511888888888',
    subscription_status: 'active'
  },
  {
    id: 't-3',
    name: 'Studio Lotus Pilates',
    slug: 'studio-lotus',
    niche: 'Fitness e Bem-Estar',
    business_hours: DEFAULT_BUSINESS_HOURS,
    whatsapp_number: '+5511777777777',
    subscription_status: 'active'
  }
];

const MOCK_SERVICES: Service[] = [
  // Barbearia services
  {
    id: 's-1',
    tenant_id: 't-1',
    name: 'Corte de Cabelo Degradê',
    description: 'Corte moderno com acabamento navalhado e finalização com pomada modeladora.',
    duration_minutes: 40,
    price: 50.00,
    is_active: true
  },
  {
    id: 's-2',
    tenant_id: 't-1',
    name: 'Barba Terapia com Toalha Quente',
    description: 'Barbear completo com espuma hidratante, toalha quente, massagem facial e pós-barba.',
    duration_minutes: 30,
    price: 40.00,
    is_active: true
  },
  {
    id: 's-3',
    tenant_id: 't-1',
    name: 'Combo Cabelo + Barba',
    description: 'O serviço completo da casa. Corte e barba com desconto especial.',
    duration_minutes: 70,
    price: 80.00,
    is_active: true
  },
  // Sorriso Saudavel services
  {
    id: 's-4',
    tenant_id: 't-2',
    name: 'Consulta de Rotina + Limpeza',
    description: 'Avaliação odontológica completa e profilaxia (limpeza) com aplicação de flúor.',
    duration_minutes: 60,
    price: 150.00,
    is_active: true
  },
  {
    id: 's-5',
    tenant_id: 't-2',
    name: 'Clareamento Dental Caseiro',
    description: 'Confecção de moldeiras personalizadas e entrega do gel clareador com orientação.',
    duration_minutes: 30,
    price: 450.00,
    is_active: true
  },
  // Pilates services
  {
    id: 's-6',
    tenant_id: 't-3',
    name: 'Aula Experimental de Pilates',
    description: 'Introdução aos aparelhos de Pilates e avaliação postural com fisioterapeuta.',
    duration_minutes: 50,
    price: 0.00,
    is_active: true
  },
  {
    id: 's-7',
    tenant_id: 't-3',
    name: 'Sessão Individual Personalizada',
    description: 'Treinamento completo focado nas necessidades posturais e de fortalecimento do aluno.',
    duration_minutes: 60,
    price: 120.00,
    is_active: true
  }
];

// Helper to generate mock appointments relative to current date
const getRelativeDateISO = (daysOffset: number, hours: number, minutes: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a-1',
    tenant_id: 't-1',
    service_id: 's-1',
    client_name: 'Guilherme Silva',
    client_phone: '(11) 98888-7777',
    appointment_time: getRelativeDateISO(0, 9, 0), // Today 09:00
    status: 'confirmed',
    notes: 'Deseja risca lateral',
    created_at: new Date().toISOString()
  },
  {
    id: 'a-2',
    tenant_id: 't-1',
    service_id: 's-2',
    client_name: 'Felipe Santos',
    client_phone: '(11) 97777-6666',
    appointment_time: getRelativeDateISO(0, 10, 0), // Today 10:00 (ends 10:30)
    status: 'scheduled',
    notes: 'Pele sensível',
    created_at: new Date().toISOString()
  },
  {
    id: 'a-3',
    tenant_id: 't-1',
    service_id: 's-1',
    client_name: 'Rafael Oliveira',
    client_phone: '(11) 96666-5555',
    appointment_time: getRelativeDateISO(1, 14, 0), // Tomorrow 14:00
    status: 'scheduled',
    created_at: new Date().toISOString()
  },
  {
    id: 'a-4',
    tenant_id: 't-2',
    service_id: 's-4',
    client_name: 'Ana Maria Costa',
    client_phone: '(11) 95555-4444',
    appointment_time: getRelativeDateISO(0, 15, 0), // Today 15:00
    status: 'confirmed',
    notes: 'Retorno semestral',
    created_at: new Date().toISOString()
  }
];

const MOCK_PROFILES: Profile[] = [
  {
    id: 'u-1',
    tenant_id: 't-1',
    name: 'Carlos Barbeiro (Admin)',
    email: 'carlos@vintage.com',
    role: 'admin'
  }
];

interface DBData {
  tenants: Tenant[];
  services: Service[];
  appointments: Appointment[];
  profiles: Profile[];
  currentTenantId: string;
  currentUserId: string;
}

// In-memory fallback for SSR or environments without localStorage
let tempStorage: DBData = {
  tenants: MOCK_TENANTS,
  services: MOCK_SERVICES,
  appointments: MOCK_APPOINTMENTS,
  profiles: MOCK_PROFILES,
  currentTenantId: 't-1', // Default logged-in tenant is Barbearia Vintage
  currentUserId: 'u-1'
};

const isClient = typeof window !== 'undefined';

function loadData(): DBData {
  if (!isClient) return tempStorage;
  
  const tenants = localStorage.getItem('slotfy_tenants');
  const services = localStorage.getItem('slotfy_services');
  const appointments = localStorage.getItem('slotfy_appointments');
  const profiles = localStorage.getItem('slotfy_profiles');
  const currentTenantId = localStorage.getItem('slotfy_current_tenant_id') || 't-1';
  
  if (!tenants || !services || !appointments || !profiles) {
    // Initial setup in localStorage
    localStorage.setItem('slotfy_tenants', JSON.stringify(MOCK_TENANTS));
    localStorage.setItem('slotfy_services', JSON.stringify(MOCK_SERVICES));
    localStorage.setItem('slotfy_appointments', JSON.stringify(MOCK_APPOINTMENTS));
    localStorage.setItem('slotfy_profiles', JSON.stringify(MOCK_PROFILES));
    localStorage.setItem('slotfy_current_tenant_id', currentTenantId);
    
    return {
      tenants: MOCK_TENANTS,
      services: MOCK_SERVICES,
      appointments: MOCK_APPOINTMENTS,
      profiles: MOCK_PROFILES,
      currentTenantId,
      currentUserId: 'u-1'
    };
  }
  
  return {
    tenants: JSON.parse(tenants),
    services: JSON.parse(services),
    appointments: JSON.parse(appointments),
    profiles: JSON.parse(profiles),
    currentTenantId,
    currentUserId: 'u-1'
  };
}

function saveData(data: typeof tempStorage) {
  if (!isClient) {
    tempStorage = data;
    return;
  }
  localStorage.setItem('slotfy_tenants', JSON.stringify(data.tenants));
  localStorage.setItem('slotfy_services', JSON.stringify(data.services));
  localStorage.setItem('slotfy_appointments', JSON.stringify(data.appointments));
  localStorage.setItem('slotfy_profiles', JSON.stringify(data.profiles));
  localStorage.setItem('slotfy_current_tenant_id', data.currentTenantId);
}

export const db = {
  // Get active tenants
  getTenants: (): Tenant[] => {
    const data = loadData();
    return data.tenants.filter(t => t.subscription_status === 'active');
  },

  // Get tenant by slug
  getTenantBySlug: (slug: string): Tenant | undefined => {
    const data = loadData();
    return data.tenants.find(t => t.slug === slug && t.subscription_status === 'active');
  },

  // Get tenant by ID
  getTenantById: (id: string): Tenant | undefined => {
    const data = loadData();
    return data.tenants.find(t => t.id === id);
  },

  // Update tenant details
  updateTenant: (id: string, updates: Partial<Tenant>): Tenant => {
    const data = loadData();
    const index = data.tenants.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Tenant not found");
    
    const updated = { ...data.tenants[index], ...updates, updated_at: new Date().toISOString() };
    data.tenants[index] = updated;
    saveData(data);
    return updated;
  },

  // Get active services for a tenant
  getServices: (tenantId: string, includeInactive = false): Service[] => {
    const data = loadData();
    return data.services.filter(s => s.tenant_id === tenantId && (includeInactive ? true : s.is_active));
  },

  // Add a new service
  createService: (tenantId: string, service: Omit<Service, 'id' | 'tenant_id'>): Service => {
    const data = loadData();
    const newService: Service = {
      ...service,
      id: 's-' + Math.random().toString(36).substr(2, 9),
      tenant_id: tenantId
    };
    data.services.push(newService);
    saveData(data);
    return newService;
  },

  // Update service details
  updateService: (id: string, updates: Partial<Service>): Service => {
    const data = loadData();
    const index = data.services.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Service not found");
    
    const updated = { ...data.services[index], ...updates };
    data.services[index] = updated;
    saveData(data);
    return updated;
  },

  // Delete a service
  deleteService: (id: string): void => {
    const data = loadData();
    data.services = data.services.filter(s => s.id !== id);
    saveData(data);
  },

  // Get busy slots (mimics get_busy_slots in schema.sql)
  getBusySlots: (tenantId: string, startDateStr: string, endDateStr: string): { busy_time: string; duration_minutes: number }[] => {
    const data = loadData();
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    return data.appointments
      .filter(a => {
        const appTime = new Date(a.appointment_time);
        return (
          a.tenant_id === tenantId &&
          appTime >= start &&
          appTime <= end &&
          a.status !== 'cancelled'
        );
      })
      .map(a => {
        const svc = data.services.find(s => s.id === a.service_id);
        return {
          busy_time: a.appointment_time,
          duration_minutes: svc ? svc.duration_minutes : 30
        };
      });
  },

  // Get appointments for a tenant
  getAppointments: (tenantId: string): Appointment[] => {
    const data = loadData();
    return data.appointments
      .filter(a => a.tenant_id === tenantId)
      .sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime());
  },

  // Create a new appointment
  createAppointment: (appointment: Omit<Appointment, 'id' | 'status' | 'created_at'>): Appointment => {
    const data = loadData();
    const newApp: Appointment = {
      ...appointment,
      id: 'a-' + Math.random().toString(36).substr(2, 9),
      status: 'scheduled',
      created_at: new Date().toISOString()
    };
    data.appointments.push(newApp);
    saveData(data);
    return newApp;
  },

  // Update appointment status
  updateAppointmentStatus: (id: string, status: Appointment['status']): Appointment => {
    const data = loadData();
    const index = data.appointments.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Appointment not found");
    
    const updated = { ...data.appointments[index], status };
    data.appointments[index] = updated;
    saveData(data);
    return updated;
  },

  // Get/Set active tenant user for session (dashboard authentication bypass)
  getCurrentSession: () => {
    const data = loadData();
    const profile = data.profiles.find(p => p.id === data.currentUserId);
    const tenant = data.tenants.find(t => t.id === data.currentTenantId);
    return {
      profile,
      tenant
    };
  },

  // Switch active tenant in session (useful for switching between mock accounts)
  switchSessionTenant: (tenantId: string) => {
    const data = loadData();
    data.currentTenantId = tenantId;
    // Find matching profile or create default profile for this tenant
    let profile = data.profiles.find(p => p.tenant_id === tenantId);
    if (!profile) {
      profile = {
        id: 'u-' + Math.random().toString(36).substr(2, 9),
        tenant_id: tenantId,
        name: 'Gerente ' + (data.tenants.find(t => t.id === tenantId)?.name || 'Estabelecimento'),
        email: 'contato@' + (data.tenants.find(t => t.id === tenantId)?.slug || 'empresa') + '.com',
        role: 'admin'
      };
      data.profiles.push(profile);
    }
    data.currentUserId = profile.id;
    saveData(data);
  }
};
