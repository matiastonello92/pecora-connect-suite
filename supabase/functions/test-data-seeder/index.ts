import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SeedDataRequest {
  type: 'locations' | 'users' | 'equipment' | 'all' | 'performance';
  count?: number;
  clear?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { type, count = 100, clear = false }: SeedDataRequest = await req.json();

    console.log(`🌱 Seeding test data: ${type}, count: ${count}, clear: ${clear}`);

    const results: any = {};

    // Clear existing data if requested
    if (clear) {
      console.log('🧹 Clearing existing test data...');
      
      if (type === 'all' || type === 'locations') {
        await supabase.from('locations').delete().like('code', 'test_%');
        results.cleared_locations = true;
      }
      
      if (type === 'all' || type === 'equipment') {
        await supabase.from('equipment').delete().like('location', 'test_%');
        results.cleared_equipment = true;
      }
    }

    // Seed locations
    if (type === 'locations' || type === 'all' || type === 'performance') {
      console.log('📍 Seeding locations...');
      
      const locations = [];
      const performanceCount = type === 'performance' ? 10000 : count;
      
      // Basic test locations
      locations.push(
        { code: 'test_italy', name: 'Italy (Test)', is_active: true, depth: 0 },
        { code: 'test_france', name: 'France (Test)', is_active: true, depth: 0 },
        { code: 'test_germany', name: 'Germany (Test)', is_active: true, depth: 0 }
      );

      // Performance test locations
      if (type === 'performance') {
        for (let country = 1; country <= 10; country++) {
          const countryCode = `perf_country_${country.toString().padStart(2, '0')}`;
          locations.push({
            code: countryCode,
            name: `Performance Country ${country}`,
            is_active: true,
            depth: 0,
            hierarchy: { country: `Performance Country ${country}` }
          });

          // Add regions for each country
          for (let region = 1; region <= 10; region++) {
            const regionCode = `perf_region_${country}_${region.toString().padStart(2, '0')}`;
            locations.push({
              code: regionCode,
              name: `Performance Region ${country}-${region}`,
              is_active: true,
              depth: 1,
              parent_location_id: countryCode,
              hierarchy: { 
                country: `Performance Country ${country}`,
                region: `Performance Region ${country}-${region}`
              }
            });

            // Add cities for each region
            for (let city = 1; city <= 99; city++) {
              const cityCode = `perf_city_${country}_${region}_${city.toString().padStart(3, '0')}`;
              locations.push({
                code: cityCode,
                name: `Performance City ${country}-${region}-${city}`,
                is_active: true,
                depth: 2,
                parent_location_id: regionCode,
                hierarchy: { 
                  country: `Performance Country ${country}`,
                  region: `Performance Region ${country}-${region}`,
                  city: `Performance City ${country}-${region}-${city}`
                }
              });
            }
          }
        }
      }

      // Insert in batches for better performance
      const batchSize = 100;
      let insertedCount = 0;
      
      for (let i = 0; i < locations.length; i += batchSize) {
        const batch = locations.slice(i, i + batchSize);
        const { error } = await supabase
          .from('locations')
          .upsert(batch, { onConflict: 'code' });
        
        if (error) throw error;
        insertedCount += batch.length;
        
        if (insertedCount % 1000 === 0) {
          console.log(`📊 Inserted ${insertedCount}/${locations.length} locations`);
        }
      }

      results.locations_created = insertedCount;
    }

    // Seed users
    if (type === 'users' || type === 'all') {
      console.log('👥 Seeding test users...');
      
      const testProfiles = [
        {
          user_id: crypto.randomUUID(),
          email: 'test.admin@managementpn.services',
          first_name: 'Test',
          last_name: 'Admin',
          role: 'super_admin',
          access_level: 'general_manager',
          locations: ['test_italy', 'test_france', 'test_germany'],
          status: 'active'
        },
        {
          user_id: crypto.randomUUID(),
          email: 'test.manager@managementpn.services',
          first_name: 'Test',
          last_name: 'Manager',
          role: 'manager',
          access_level: 'assistant_manager',
          locations: ['test_italy'],
          status: 'active'
        },
        {
          user_id: crypto.randomUUID(),
          email: 'test.user@managementpn.services',
          first_name: 'Test',
          last_name: 'User',
          role: 'staff',
          access_level: 'base',
          locations: ['test_italy'],
          status: 'active'
        }
      ];

      // Add more users for performance testing
      for (let i = 4; i <= count; i++) {
        testProfiles.push({
          user_id: crypto.randomUUID(),
          email: `test.user${i}@managementpn.services`,
          first_name: `Test`,
          last_name: `User ${i}`,
          role: 'staff',
          access_level: 'base',
          locations: ['test_italy'],
          status: 'active'
        });
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(testProfiles, { onConflict: 'email' });
      
      if (error) throw error;
      results.users_created = testProfiles.length;
    }

    // Seed equipment
    if (type === 'equipment' || type === 'all') {
      console.log('🔧 Seeding test equipment...');
      
      const equipment = [];
      const locations = ['test_italy', 'test_france', 'test_germany'];
      const categories = ['Kitchen', 'Technology', 'Furniture', 'Cleaning'];
      const departments = ['Kitchen', 'Front of House', 'Back Office', 'Maintenance'];

      for (let i = 1; i <= count; i++) {
        equipment.push({
          name: `Test Equipment ${i}`,
          category: categories[i % categories.length],
          department: departments[i % departments.length],
          location: locations[i % locations.length],
          status: 'operational',
          model: `Test Model ${i}`,
          serial_number: `TEST${i.toString().padStart(6, '0')}`,
          purchase_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }

      const { error } = await supabase
        .from('equipment')
        .upsert(equipment);
      
      if (error) throw error;
      results.equipment_created = equipment.length;
    }

    // Initialize required chats for test locations
    if (type === 'all') {
      console.log('💬 Creating required chats...');
      
      const { data: chatResults, error: chatError } = await supabase
        .rpc('ensure_chats_for_all_locations');
      
      if (chatError) {
        console.warn('Warning: Could not create chats:', chatError);
      } else {
        results.chats_created = chatResults?.length || 0;
      }
    }

    const response = {
      success: true,
      message: `Test data seeded successfully for type: ${type}`,
      results,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Test data seeding completed:', results);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
};

serve(handler);