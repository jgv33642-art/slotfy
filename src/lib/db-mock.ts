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
  address?: string;
  logo_url?: string;
  primary_color?: string;
  instagram_handle?: string;
  facebook_handle?: string;
  blacklist_numbers?: string[];
  plan_type?: 'personal' | 'enterprise';
  blocked_dates?: string[];
  description?: string;
  website_url?: string;
  pix_key?: string;
  success_message?: string;
  subscription_expires_at?: string;
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

export interface Professional {
  id: string;
  tenant_id: string;
  name: string;
  avatar_url?: string;
  specialty?: string;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  service_id: string;
  professional_id?: string;
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
    subscription_status: 'active',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    primary_color: '#d97706', // amber-600
    logo_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=100&q=80',
    instagram_handle: 'barbearia_vintage',
    blacklist_numbers: [],
    plan_type: 'enterprise',
    blocked_dates: [],
    description: 'Estilo clássico com técnicas modernas. Atendimento personalizado para o homem contemporâneo.',
    website_url: 'https://barbeariavintage.com.br',
    pix_key: 'financeiro@barbeariavintage.com.br',
    success_message: 'Por favor, chegue com 10 minutos de antecedência. Em caso de atraso, entre em contato.',
    subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
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
    subscription_status: 'active',
    address: 'Rua Augusta, 500 - Consolação, São Paulo - SP',
    primary_color: '#059669', // emerald-600
    logo_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=100&q=80',
    instagram_handle: 'sorriso_saudavel',
    blacklist_numbers: [],
    plan_type: 'enterprise',
    blocked_dates: [],
    description: 'Cuidando do seu sorriso com dedicação, tecnologia de ponta e profissionais especializados.',
    website_url: 'https://clinicasorrisosaudavel.com.br',
    pix_key: '11888888888',
    success_message: 'Traga um documento de identidade com foto para a sua consulta de rotina.',
    subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 't-3',
    name: 'Studio Lotus Pilates',
    slug: 'studio-lotus',
    niche: 'Fitness e Bem-Estar',
    business_hours: DEFAULT_BUSINESS_HOURS,
    whatsapp_number: '+5511777777777',
    subscription_status: 'active',
    address: 'Alameda Lorena, 1500 - Jardins, São Paulo - SP',
    primary_color: '#2563eb', // blue-600
    logo_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=100&q=80',
    instagram_handle: 'lotus_pilates',
    blacklist_numbers: [],
    plan_type: 'personal',
    blocked_dates: [],
    description: 'Fisioterapia e Pilates clínico para todas as idades. Melhore sua postura e qualidade de vida.',
    website_url: 'https://studiolotus.com.br',
    pix_key: 'lotus@studiolotus.com.br',
    success_message: 'Use roupas leves e confortáveis para a sua prática de Pilates.',
    subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_PROFESSIONALS: Professional[] = [
  // Barbearia Vintage & Navalha (t-1)
  {
    id: 'p-1',
    tenant_id: 't-1',
    name: 'Carlos Barbeiro',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    specialty: 'Corte Degradê & Barba Navalhada',
    is_active: true
  },
  {
    id: 'p-2',
    tenant_id: 't-1',
    name: 'Felipe Santos',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    specialty: 'Visagismo & Barbaterapia',
    is_active: true
  },
  // Clínica Sorriso Saudável (t-2)
  {
    id: 'p-3',
    tenant_id: 't-2',
    name: 'Dra. Beatriz Santos',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    specialty: 'Ortodontia & Estética Dental',
    is_active: true
  },
  // Studio Lotus Pilates (t-3)
  {
    id: 'p-4',
    tenant_id: 't-3',
    name: 'Prof. Amanda Costa',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    specialty: 'Fisioterapia & Pilates Clinico',
    is_active: true
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
  professionals: Professional[];
  currentTenantId: string;
  currentUserId: string;
}

// In-memory fallback for SSR or environments without localStorage
let tempStorage: DBData = {
  tenants: MOCK_TENANTS,
  services: MOCK_SERVICES,
  appointments: MOCK_APPOINTMENTS,
  profiles: MOCK_PROFILES,
  professionals: MOCK_PROFESSIONALS,
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
  const professionals = localStorage.getItem('slotfy_professionals');
  const currentTenantId = localStorage.getItem('slotfy_current_tenant_id') || 't-1';
  
  if (!tenants || !services || !appointments || !profiles || !professionals) {
    // Initial setup in localStorage
    localStorage.setItem('slotfy_tenants', JSON.stringify(MOCK_TENANTS));
    localStorage.setItem('slotfy_services', JSON.stringify(MOCK_SERVICES));
    localStorage.setItem('slotfy_appointments', JSON.stringify(MOCK_APPOINTMENTS));
    localStorage.setItem('slotfy_profiles', JSON.stringify(MOCK_PROFILES));
    localStorage.setItem('slotfy_professionals', JSON.stringify(MOCK_PROFESSIONALS));
    localStorage.setItem('slotfy_current_tenant_id', currentTenantId);
    
    return {
      tenants: MOCK_TENANTS,
      services: MOCK_SERVICES,
      appointments: MOCK_APPOINTMENTS,
      profiles: MOCK_PROFILES,
      professionals: MOCK_PROFESSIONALS,
      currentTenantId,
      currentUserId: 'u-1'
    };
  }

  // Parse existing data
  let parsedTenants = JSON.parse(tenants);
  let needsSave = false;

  // Migration: Ensure t-3 is strictly 'personal' and that description, website, address, pix keys exist
  parsedTenants = parsedTenants.map((t: any) => {
    if (t.id === 't-3' && t.plan_type !== 'personal') {
      t.plan_type = 'personal';
      needsSave = true;
    }
    const seed = MOCK_TENANTS.find(m => m.id === t.id);
    if (seed) {
      if (t.pix_key === undefined || t.pix_key === null) {
        t.pix_key = seed.pix_key;
        needsSave = true;
      }
      if (t.success_message === undefined || t.success_message === null) {
        t.success_message = seed.success_message;
        needsSave = true;
      }
      if (t.description === undefined || t.description === null) {
        t.description = seed.description;
        needsSave = true;
      }
      if (t.website_url === undefined || t.website_url === null) {
        t.website_url = seed.website_url;
        needsSave = true;
      }
      if (t.address === undefined || t.address === null) {
        t.address = seed.address;
        needsSave = true;
      }
    }
    if (!t.subscription_expires_at) {
      t.subscription_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      needsSave = true;
    }
  });

  if (needsSave) {
    localStorage.setItem('slotfy_tenants', JSON.stringify(parsedTenants));
  }
  
  return {
    tenants: parsedTenants,
    services: JSON.parse(services),
    appointments: JSON.parse(appointments),
    profiles: JSON.parse(profiles),
    professionals: JSON.parse(professionals),
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
  localStorage.setItem('slotfy_professionals', JSON.stringify(data.professionals));
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
  },

  // Register a new tenant during checkout
  registerTenant: (params: {
    name: string;
    email: string;
    password?: string;
    tenantName: string;
    whatsappNumber: string;
    address: string;
    niche: string;
    plan: string;
  }): { tenant: Tenant; profile: Profile } => {
    const data = loadData();
    
    // Generate clean unique slug
    let slug = params.tenantName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
      
    let tempSlug = slug;
    let counter = 1;
    while (data.tenants.some(t => t.slug === tempSlug)) {
      tempSlug = `${slug}-${counter}`;
      counter++;
    }
    slug = tempSlug;

    const tenantId = 't-' + Math.random().toString(36).substr(2, 9);
    const newTenant: Tenant = {
      id: tenantId,
      name: params.tenantName,
      slug: slug,
      niche: params.niche,
      business_hours: DEFAULT_BUSINESS_HOURS,
      whatsapp_number: params.whatsappNumber,
      subscription_status: 'active',
      address: params.address,
      plan_type: params.plan === 'enterprise' ? 'enterprise' : 'personal',
      blocked_dates: [],
      subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const profileId = 'u-' + Math.random().toString(36).substr(2, 9);
    const newProfile: Profile = {
      id: profileId,
      tenant_id: tenantId,
      name: params.name,
      email: params.email,
      role: 'admin'
    };

    // Auto-seed a default professional using the owner's name and general specialty
    const newProfessional: Professional = {
      id: 'p-' + Math.random().toString(36).substr(2, 9),
      tenant_id: tenantId,
      name: params.name,
      specialty: 'Atendimento Geral',
      is_active: true,
      avatar_url: ''
    };

    data.tenants.push(newTenant);
    data.profiles.push(newProfile);
    data.professionals.push(newProfessional);
    data.currentTenantId = tenantId;
    data.currentUserId = profileId;
    
    saveData(data);

    return {
      tenant: newTenant,
      profile: newProfile
    };
  },

  // Get active professionals for a tenant
  getProfessionals: (tenantId: string, includeInactive = false): Professional[] => {
    const data = loadData();
    return data.professionals.filter(p => p.tenant_id === tenantId && (includeInactive ? true : p.is_active));
  },

  // Add a new professional
  createProfessional: (tenantId: string, professional: Omit<Professional, 'id' | 'tenant_id'>): Professional => {
    const data = loadData();
    const newProfessional: Professional = {
      ...professional,
      id: 'p-' + Math.random().toString(36).substr(2, 9),
      tenant_id: tenantId
    };
    data.professionals.push(newProfessional);
    saveData(data);
    return newProfessional;
  },

  // Update professional details
  updateProfessional: (id: string, updates: Partial<Professional>): Professional => {
    const data = loadData();
    const index = data.professionals.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Professional not found");
    
    const updated = { ...data.professionals[index], ...updates };
    data.professionals[index] = updated;
    saveData(data);
    return updated;
  },

  // Delete a professional
  deleteProfessional: (id: string): void => {
    const data = loadData();
    data.professionals = data.professionals.filter(p => p.id !== id);
    saveData(data);
  },

  // Toggle client number blacklist
  toggleBlacklistNumber: (tenantId: string, phoneNumber: string): string[] => {
    const data = loadData();
    const tenantIndex = data.tenants.findIndex(t => t.id === tenantId);
    if (tenantIndex === -1) throw new Error("Tenant not found");
    
    const tenant = data.tenants[tenantIndex];
    let blacklist = tenant.blacklist_numbers || [];
    
    if (blacklist.includes(phoneNumber)) {
      blacklist = blacklist.filter(num => num !== phoneNumber);
    } else {
      blacklist = [...blacklist, phoneNumber];
    }
    
    data.tenants[tenantIndex] = {
      ...tenant,
      blacklist_numbers: blacklist
    };
    saveData(data);
    return blacklist;
  },

  // Super Admin Methods
  getAllTenantsAdmin: (): Tenant[] => {
    const data = loadData();
    return data.tenants;
  },
  updateTenantStatusAdmin: (tenantId: string, status: 'active' | 'inactive' | 'past_due'): Tenant => {
    const data = loadData();
    const idx = data.tenants.findIndex(t => t.id === tenantId);
    if (idx !== -1) {
      data.tenants[idx].subscription_status = status;
      saveData(data);
      return data.tenants[idx];
    }
    throw new Error('Tenant not found');
  },
  updateTenantPlanAdmin: (tenantId: string, plan: 'personal' | 'enterprise'): Tenant => {
    const data = loadData();
    const idx = data.tenants.findIndex(t => t.id === tenantId);
    if (idx !== -1) {
      data.tenants[idx].plan_type = plan;
      saveData(data);
      return data.tenants[idx];
    }
    throw new Error('Tenant not found');
  },
  deleteTenantAdmin: (tenantId: string): void => {
    const data = loadData();
    data.tenants = data.tenants.filter(t => t.id !== tenantId);
    data.profiles = data.profiles.filter(p => p.tenant_id !== tenantId);
    // Also cleanup appointments, services and professionals associated
    data.appointments = data.appointments.filter(a => a.tenant_id !== tenantId);
    data.services = data.services.filter(s => s.tenant_id !== tenantId);
    data.professionals = data.professionals.filter(p => p.tenant_id !== tenantId);
    saveData(data);
  },
  addBlockedDate: (tenantId: string, dateStr: string): string[] => {
    const data = loadData();
    const tenantIndex = data.tenants.findIndex(t => t.id === tenantId);
    if (tenantIndex === -1) throw new Error("Tenant not found");
    const tenant = data.tenants[tenantIndex];
    let blocked = tenant.blocked_dates || [];
    if (!blocked.includes(dateStr)) {
      blocked = [...blocked, dateStr];
    }
    data.tenants[tenantIndex] = {
      ...tenant,
      blocked_dates: blocked
    };
    saveData(data);
    return blocked;
  },
  removeBlockedDate: (tenantId: string, dateStr: string): string[] => {
    const data = loadData();
    const tenantIndex = data.tenants.findIndex(t => t.id === tenantId);
    if (tenantIndex === -1) throw new Error("Tenant not found");
    const tenant = data.tenants[tenantIndex];
    let blocked = tenant.blocked_dates || [];
    blocked = blocked.filter(d => d !== dateStr);
    data.tenants[tenantIndex] = {
      ...tenant,
      blocked_dates: blocked
    };
    saveData(data);
    return blocked;
  }
};
