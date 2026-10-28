const { createClient } = window.supabase;
export const client = createClient(
  "https://nwcatsmfbkcgvgbanwyl.supabase.co",
  "sb_publishable_vXuRHP_lqGqtV9d1C_oZWw_SetdoY7L",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
export async function unwrap(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
export const rpc = (name, args = {}) => unwrap(client.rpc(name, args));
export const list = (table, columns = "*", order = "id") =>
  unwrap(
    client
      .from(table)
      .select(columns)
      .order(order, { ascending: false })
      .limit(500),
  );
