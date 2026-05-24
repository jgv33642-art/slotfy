import { supabase } from './supabase';
import { db as mockDb, Tenant, Service, Appointment, Profile } from './db-mock';

export type { Tenant, Service, Appointment, Profile };

export const db = {
  isSupabaseActive: (): boolean => {
    return supabase !== null;
  },

  // Get active tenants
  getTenants: async (): Promise<Tenant[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('subscription_status', 'active');
      if (error) {
        console.error("Error fetching tenants from Supabase:", error);
        return mockDb.getTenants();
      }
      return data || [];
    }
    return mockDb.getTenants();
  },

  // Get tenant by slug
  getTenantBySlug: async (slug: string): Promise<Tenant | undefined> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .eq('subscription_status', 'active')
        .maybeSingle();
      if (error) {
        console.error(`Error fetching tenant by slug ${slug}:`, error);
        return mockDb.getTenantBySlug(slug);
      }
      return data || undefined;
    }
    return mockDb.getTenantBySlug(slug);
  },

  // Get tenant by ID
  getTenantById: async (id: string): Promise<Tenant | undefined> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) {
        console.error(`Error fetching tenant by ID ${id}:`, error);
        return mockDb.getTenantById(id);
      }
      return data || undefined;
    }
    return mockDb.getTenantById(id);
  },

  // Update tenant details
  updateTenant: async (id: string, updates: Partial<Tenant>): Promise<Tenant> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error(`Error updating tenant ${id}:`, error);
        return mockDb.updateTenant(id, updates);
      }
      return data;
    }
    return mockDb.updateTenant(id, updates);
  },

  // Get active services for a tenant
  getServices: async (tenantId: string, includeInactive = false): Promise<Service[]> => {
    if (supabase) {
      let query = supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId);
      
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) {
        console.error(`Error fetching services for tenant ${tenantId}:`, error);
        return mockDb.getServices(tenantId, includeInactive);
      }
      return data || [];
    }
    return mockDb.getServices(tenantId, includeInactive);
  },

  // Add a new service
  createService: async (tenantId: string, service: Omit<Service, 'id' | 'tenant_id'>): Promise<Service> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('services')
        .insert({ ...service, tenant_id: tenantId })
        .select()
        .single();
      if (error) {
        console.error("Error creating service in Supabase:", error);
        return mockDb.createService(tenantId, service);
      }
      return data;
    }
    return mockDb.createService(tenantId, service);
  },

  // Update service details
  updateService: async (id: string, updates: Partial<Service>): Promise<Service> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error(`Error updating service ${id}:`, error);
        return mockDb.updateService(id, updates);
      }
      return data;
    }
    return mockDb.updateService(id, updates);
  },

  // Delete a service
  deleteService: async (id: string): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      if (error) {
        console.error(`Error deleting service ${id}:`, error);
        return mockDb.deleteService(id);
      }
      return;
    }
    return mockDb.deleteService(id);
  },

  // Get busy slots (calls RPC get_busy_slots in Supabase database)
  getBusySlots: async (tenantId: string, startDateStr: string, endDateStr: string): Promise<{ busy_time: string; duration_minutes: number }[]> => {
    if (supabase) {
      const { data, error } = await supabase.rpc('get_busy_slots', {
        p_tenant_id: tenantId,
        p_start_date: startDateStr,
        p_end_date: endDateStr
      });
      if (error) {
        console.error("Error invoking RPC get_busy_slots in Supabase:", error);
        return mockDb.getBusySlots(tenantId, startDateStr, endDateStr);
      }
      return data || [];
    }
    return mockDb.getBusySlots(tenantId, startDateStr, endDateStr);
  },

  // Get appointments for a tenant
  getAppointments: async (tenantId: string): Promise<Appointment[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('appointment_time', { ascending: true });
      if (error) {
        console.error(`Error fetching appointments for tenant ${tenantId}:`, error);
        return mockDb.getAppointments(tenantId);
      }
      return data || [];
    }
    return mockDb.getAppointments(tenantId);
  },

  // Create a new appointment
  createAppointment: async (appointment: Omit<Appointment, 'id' | 'status' | 'created_at'>): Promise<Appointment> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single();
      if (error) {
        console.error("Error creating appointment in Supabase:", error);
        return mockDb.createAppointment(appointment);
      }
      return data;
    }
    return mockDb.createAppointment(appointment);
  },

  // Update appointment status
  updateAppointmentStatus: async (id: string, status: Appointment['status']): Promise<Appointment> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error(`Error updating appointment status ${id}:`, error);
        return mockDb.updateAppointmentStatus(id, status);
      }
      return data;
    }
    return mockDb.updateAppointmentStatus(id, status);
  },

  // Get/Set active tenant user for session (dashboard auth)
  getCurrentSession: async (): Promise<{ tenant: Tenant | undefined; profile: Profile | undefined }> => {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch profile
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileData && !profileErr) {
          // Fetch tenant
          const { data: tenantData, error: tenantErr } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profileData.tenant_id)
            .maybeSingle();
          
          if (tenantData && !tenantErr) {
            return {
              tenant: tenantData,
              profile: profileData
            };
          }
        }
      }
    }
    // Fallback to mock session
    const mockSession = mockDb.getCurrentSession();
    return {
      tenant: mockSession.tenant || undefined,
      profile: mockSession.profile || undefined
    };
  },

  // Switch active tenant in session (useful for sandbox mode)
  switchSessionTenant: async (tenantId: string): Promise<void> => {
    // If Supabase is active, switching requires logging in as a user belonging to that tenant.
    // For sandbox convenience, we still switch the mockDb session.
    mockDb.switchSessionTenant(tenantId);
  }
};
