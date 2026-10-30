import { createClient } from 'npm:@supabase/supabase-js@2.57.0';
import { createDownloadHandler } from './handler.js';
Deno.serve(createDownloadHandler({ createClient, env: (name: string) => Deno.env.get(name) }));
