import { SupabaseClient } from "npm:@supabase/supabase-js@2.39.3"

/**
 * 部位マスターの取得
 */
export async function fetchParts(supabase: SupabaseClient, tableName: string) {
  const { data, error } = await supabase
    .from(tableName)
    .select("part_id, part_name, part_color")
    .order("part_id", { ascending: true })
  if (error) throw error
  return data
}

/**
 * 種目マスターの取得
 */
export async function fetchMenus(supabase: SupabaseClient, tableName: string) {
  const { data, error } = await supabase
    .from(tableName)
    .select("menu_id, part_id, menu_name")
    .order("menu_id", { ascending: true })
  if (error) throw error
  return data
}

/**
 * トレーニング記録の一覧取得 (リレーションを含む)
 */
export async function fetchAllRecords(supabase: SupabaseClient, config: {
  recordTable: string,
  partTable: string,
  menuTable: string,
  detailTable: string
}) {
  const { data, error } = await supabase
    .from(config.recordTable)
    .select(`
      record_id,
      ${config.partTable} (part_name, part_color),
      ${config.menuTable} (menu_name),
      set_count,
      ${config.detailTable} (current_set, weight, reps),
      note,
      create_date
    `)
    .order("record_id", { ascending: true })
  if (error) throw error
  return data
}

/**
 * トレーニング記録の新規登録
 */
export async function insertTrainingRecord(supabase: SupabaseClient, recordData: any) {
  // 1. 種目名から menu_id を特定 (もし ID が直接渡されない場合)
  const { data: menuData, error: menuError } = await supabase
    .from("menu_master")
    .select("menu_id")
    .eq("menu_name", recordData.menuName)
    .single()
  if (menuError) throw new Error(`Menu not found: ${recordData.menuName}`)

  // 2. recordテーブルへ挿入
  const { data: insertedRecord, error: recordError } = await supabase
    .from("record")
    .insert({
      part_id: recordData.partId,
      menu_id: menuData.menu_id,
      set_count: recordData.setCount,
      create_date: recordData.createDate,
      note: recordData.note,
    })
    .select("record_id")
    .single()
  if (recordError) throw recordError

  // 3. set_detailテーブルへセット情報を挿入
  const setDetails = recordData.weight.map((w: number, i: number) => ({
    record_id: insertedRecord.record_id,
    current_set: i + 1,
    weight: w,
    reps: recordData.reps[i],
  }))

  const { error: detailError } = await supabase.from("set_detail").insert(setDetails)
  if (detailError) throw detailError

  return { message: "Record inserted successfully", recordId: insertedRecord.record_id }
}

/**
 * トレーニング記録の削除 (詳細も併せて削除)
 */
export async function deleteTrainingRecord(supabase: SupabaseClient, recordId: number) {
  // 子テーブル(set_detail)から削除
  const { error: detailError } = await supabase.from("set_detail").delete().eq("record_id", recordId)
  if (detailError) throw detailError

  // 親テーブル(record)から削除
  const { error: recordError } = await supabase.from("record").delete().eq("record_id", recordId)
  if (recordError) throw recordError

  return { message: "Record deleted successfully" }
}

/**
 * 新しい種目の登録
 */
export async function insertMenu(supabase: SupabaseClient, { partId, menuName }: { partId: number, menuName: string }) {
  const { error } = await supabase.from("menu_master").insert({ part_id: partId, menu_name: menuName })
  if (error) throw error
  return { message: "Menu inserted successfully" }
}