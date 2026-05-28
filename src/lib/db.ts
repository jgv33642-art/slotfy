import { supabase } from './supabase';
import { db as mockDb, Tenant, Service, Appointment, Profile, Professional } from './db-mock';

export type { Tenant, Service, Appointment, Profile, Professional };


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
  },

  // Register a new tenant during checkout
  registerTenant: async (params: {
    name: string;
    email: string;
    password?: string;
    tenantName: string;
    whatsappNumber: string;
    address: string;
    niche: string;
    plan: string;
  }): Promise<{ tenant: Tenant; profile: Profile }> => {
    if (supabase) {
      try {
        let slug = params.tenantName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
        
        const { data: existingTenant } = await supabase
          .from('tenants')
          .select('slug')
          .eq('slug', slug)
          .maybeSingle();

        if (existingTenant) {
          slug = `${slug}-${Math.random().toString(36).substr(2, 4)}`;
        }

        const { data: tenantData, error: tenantErr } = await supabase
          .from('tenants')
          .insert({
            name: params.tenantName,
            slug: slug,
            niche: params.niche,
            whatsapp_number: params.whatsappNumber,
            address: params.address,
            subscription_status: 'active',
            plan_type: params.plan === 'enterprise' ? 'enterprise' : 'personal'
          })
          .select()
          .single();

        if (tenantErr) throw tenantErr;

        // Auto-seed default professional in Supabase
        const { error: profErr } = await supabase
          .from('professionals')
          .insert({
            tenant_id: tenantData.id,
            name: params.name,
            specialty: 'Atendimento Geral',
            is_active: true
          });
        if (profErr) {
          console.error("Error creating default professional in Supabase:", profErr);
        }

        if (params.password) {
          const { data: authData, error: authErr } = await supabase.auth.signUp({
            email: params.email,
            password: params.password,
            options: {
              data: {
                name: params.name
              }
            }
          });

          if (authErr) {
            await supabase.from('tenants').delete().eq('id', tenantData.id);
            throw authErr;
          }

          if (authData.user) {
            const { data: profileData, error: profileErr } = await supabase
              .from('profiles')
              .insert({
                id: authData.user.id,
                tenant_id: tenantData.id,
                name: params.name,
                email: params.email,
                role: 'admin'
              })
              .select()
              .single();

            if (profileErr) {
              console.error("Error creating profile in Supabase:", profileErr);
            }

            return {
              tenant: tenantData,
              profile: profileData || {
                id: authData.user.id,
                tenant_id: tenantData.id,
                name: params.name,
                email: params.email,
                role: 'admin'
              }
            };
          }
        }

        return {
          tenant: tenantData,
          profile: {
            id: 'mock-auth-id',
            tenant_id: tenantData.id,
            name: params.name,
            email: params.email,
            role: 'admin'
          }
        };

      } catch (err) {
        console.error("Failed to register tenant in Supabase. Using fallback.", err);
        return mockDb.registerTenant(params);
      }
    }

    return mockDb.registerTenant(params);
  },

  // Get active professionals for a tenant
  getProfessionals: async (tenantId: string, includeInactive = false): Promise<Professional[]> => {
    if (supabase) {
      let query = supabase
        .from('professionals')
        .select('*')
        .eq('tenant_id', tenantId);
      
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) {
        console.error(`Error fetching professionals for tenant ${tenantId}:`, error);
        return mockDb.getProfessionals(tenantId, includeInactive);
      }
      return data || [];
    }
    return mockDb.getProfessionals(tenantId, includeInactive);
  },

  // Add a new professional
  createProfessional: async (tenantId: string, professional: Omit<Professional, 'id' | 'tenant_id'>): Promise<Professional> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('professionals')
        .insert({ ...professional, tenant_id: tenantId })
        .select()
        .single();
      if (error) {
        console.error("Error creating professional in Supabase:", error);
        return mockDb.createProfessional(tenantId, professional);
      }
      return data;
    }
    return mockDb.createProfessional(tenantId, professional);
  },

  // Update professional details
  updateProfessional: async (id: string, updates: Partial<Professional>): Promise<Professional> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('professionals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error(`Error updating professional ${id}:`, error);
        return mockDb.updateProfessional(id, updates);
      }
      return data;
    }
    return mockDb.updateProfessional(id, updates);
  },

  // Delete a professional
  deleteProfessional: async (id: string): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('professionals')
        .delete()
        .eq('id', id);
      if (error) {
        console.error(`Error deleting professional ${id}:`, error);
        return mockDb.deleteProfessional(id);
      }
      return;
    }
    return mockDb.deleteProfessional(id);
  },

  // Toggle client number blacklist
  toggleBlacklistNumber: async (tenantId: string, phoneNumber: string): Promise<string[]> => {
    if (supabase) {
      try {
        const { data: tenantData, error: getErr } = await supabase
          .from('tenants')
          .select('blacklist_numbers')
          .eq('id', tenantId)
          .single();

        if (getErr) throw getErr;

        let blacklist = tenantData.blacklist_numbers || [];
        if (blacklist.includes(phoneNumber)) {
          blacklist = blacklist.filter((num: string) => num !== phoneNumber);
        } else {
          blacklist = [...blacklist, phoneNumber];
        }

        const { data: updatedTenant, error: updateErr } = await supabase
          .from('tenants')
          .update({ blacklist_numbers: blacklist })
          .eq('id', tenantId)
          .select('blacklist_numbers')
          .single();

        if (updateErr) throw updateErr;
        return updatedTenant.blacklist_numbers;
      } catch (err) {
        console.error("Error toggling blacklist number in Supabase:", err);
        return mockDb.toggleBlacklistNumber(tenantId, phoneNumber);
      }
    }
    return mockDb.toggleBlacklistNumber(tenantId, phoneNumber);
  },

  // Super Admin Methods
  getAllTenantsAdmin: async (): Promise<Tenant[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('name', { ascending: true });
      if (error) {
        console.error("Error fetching all tenants from Supabase:", error);
        return mockDb.getAllTenantsAdmin();
      }
      return data || [];
    }
    return mockDb.getAllTenantsAdmin();
  },

  updateTenantStatusAdmin: async (tenantId: string, status: 'active' | 'inactive' | 'past_due'): Promise<Tenant> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('tenants')
        .update({ subscription_status: status })
        .eq('id', tenantId)
        .select()
        .single();
      if (error) {
        console.error("Error updating tenant status in Supabase:", error);
        return mockDb.updateTenantStatusAdmin(tenantId, status);
      }
      return data;
    }
    return mockDb.updateTenantStatusAdmin(tenantId, status);
  },

  updateTenantPlanAdmin: async (tenantId: string, plan: 'personal' | 'enterprise'): Promise<Tenant> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('tenants')
        .update({ plan_type: plan })
        .eq('id', tenantId)
        .select()
        .single();
      if (error) {
        console.error("Error updating tenant plan in Supabase:", error);
        return mockDb.updateTenantPlanAdmin(tenantId, plan);
      }
      return data;
    }
    return mockDb.updateTenantPlanAdmin(tenantId, plan);
  },

  deleteTenantAdmin: async (tenantId: string): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);
      if (error) {
        console.error("Error deleting tenant from Supabase:", error);
        return mockDb.deleteTenantAdmin(tenantId);
      }
      return;
    }
    return mockDb.deleteTenantAdmin(tenantId);
  },

  addBlockedDate: async (tenantId: string, dateStr: string): Promise<string[]> => {
    if (supabase) {
      try {
        const { data: tenantData, error: getErr } = await supabase
          .from('tenants')
          .select('blocked_dates')
          .eq('id', tenantId)
          .single();

        if (getErr) throw getErr;

        let blocked = tenantData.blocked_dates || [];
        if (!blocked.includes(dateStr)) {
          blocked = [...blocked, dateStr];
        }

        const { data: updatedTenant, error: updateErr } = await supabase
          .from('tenants')
          .update({ blocked_dates: blocked })
          .eq('id', tenantId)
          .select('blocked_dates')
          .single();

        if (updateErr) throw updateErr;
        return updatedTenant.blocked_dates;
      } catch (err) {
        console.error("Error adding blocked date in Supabase:", err);
        return mockDb.addBlockedDate(tenantId, dateStr);
      }
    }
    return mockDb.addBlockedDate(tenantId, dateStr);
  },

  removeBlockedDate: async (tenantId: string, dateStr: string): Promise<string[]> => {
    if (supabase) {
      try {
        const { data: tenantData, error: getErr } = await supabase
          .from('tenants')
          .select('blocked_dates')
          .eq('id', tenantId)
          .single();

        if (getErr) throw getErr;

        let blocked = tenantData.blocked_dates || [];
        blocked = blocked.filter((d: string) => d !== dateStr);

        const { data: updatedTenant, error: updateErr } = await supabase
          .from('tenants')
          .update({ blocked_dates: blocked })
          .eq('id', tenantId)
          .select('blocked_dates')
          .single();

        if (updateErr) throw updateErr;
        return updatedTenant.blocked_dates;
      } catch (err) {
        console.error("Error removing blocked date in Supabase:", err);
        return mockDb.removeBlockedDate(tenantId, dateStr);
      }
    }
    return mockDb.removeBlockedDate(tenantId, dateStr);
  }
};

