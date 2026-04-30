import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://flonbyhyhafzyqcmbqxi.supabase.co";
const supabaseKey = "sb_publishable_0ynt254GmfAKKURC9D7qLA_OKEjRgPB";

export const supabase = createClient(supabaseUrl, supabaseKey);
