// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import {createClient} from "npm:@supabase/supabase-js@2.39.3"

// supabase接続
const supabaseUrl = Deno.env.get("SUPABASE_URL")
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  // CORS設定
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // 全てのオリジンを許可
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", // 許可するヘッダー
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS", // 許可するメソッド
    "Access-Control-Allow-Credentials": "true", // クッキーなどの認証情報を許可
  };

  // OPTIONSリクエストへの対応
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  // URLからパスを取得
  const url = new URL(req.url)
  const path = url.pathname.split("/").pop()

  // パスに応じて処理を振り分ける
  switch (path) {
    case "fetchPart":
      // part_masterテーブルからデータを取得する
      return await fetchPart(req)
      break;
    case "fetchMenu":
      // menu_masterテーブルからデータを取得する
      return await fetchMenu(req)
      break;
    case "insertRecord":
      // recordテーブルへデータを追加する
      return await insertRecord(req)
      break;
    case "fetchRecords":
      // recordテーブルからデータを取得する
      return await fetchRecords(req)
      break;
    case "insertMenu":
      // menu_masterテーブルへデータを追加する
      return await insertMenu(req)
      break;
    case "deleteRecord":
      // recordテーブルからデータ削除する
      return await deleteRecord(req)
      break;
    case "fetchOldPart":
      // part_masterテーブルからデータを取得する
      return await fetchOldPart(req)
      break;
    case "fetchOldMenu":
      // menu_masterテーブルからデータを取得する
      return await fetchOldMenu(req)
      break;
    case "fetchOldRecords":
      // recordテーブルからデータを取得する
      return await fetchOldRecords(req)
      break;
    default:
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
      break;
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/training_record' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

/**
 * データ取得（部位）
 * @param req 
 * @returns 
 */
async function fetchPart(req: Request): Promise<Response> {
  const {data, error} = await supabase
  .from("part_master")
  .select("part_id, part_name, part_color")
  .order("part_id", { ascending: true })

  // エラーハンドリング
  if (error) {
    console.log('fethcPart error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
  });
}

/**
 * データ取得（種目）
 * @param req 
 * @returns 
 */
async function fetchMenu(req: Request): Promise<Response> {
  const {data, error} = await supabase
  .from("menu_master")
  .select("menu_id, part_id, menu_name")
  .order("menu_id", { ascending: true })

  // エラーハンドリング
  if (error) {
    console.log('fethcMenu error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
  });
}

/**
 * データ取得（種目ID）
 * @param menuName 
 * @returns 
 */
async function fetchMenuIdByMenuName(menuName: string): Promise<number | null>{
  const {data, error} = await supabase
  .from("menu_master")
  .select("menu_id")
  .eq("menu_name", menuName)

  // エラーハンドリング
  if (error) {
    console.log('fetchMenuIdByMenuName error:', error)
    return null
  }

  if (data.length === 0) {
    return null
  } else {
    return data[0].menu_id
  }
}


/**
 * レコード追加（record）
 * @param req 
 * @returns 
 */
async function insertRecord(req: Request): Promise<Response> {
  // bodyをJSON形式で取得
  const body = await req.json()
  const recordData = JSON.parse(body.record);

  console.log(recordData)

  // menu_masterテーブルからmenu_idを取得
  const menuId = await fetchMenuIdByMenuName(recordData.menuName)

  // 必要なデータのみを抽出
  const insertData = {
    part_id: recordData.partId,
    menu_id: menuId,
    set_count: recordData.setCount,
    create_date: recordData.createDate,
    note: recordData.note,
  };

  // recordテーブルにデータを挿入し、挿入されたレコードのidを取得
  const {data: insertRecord, error: insertRecordError} = await supabase
  .from("record")
  .insert(insertData)
  .select("record_id") // 挿入されたレコードのidを取得

  // エラーハンドリング
  if (insertRecordError) {
    console.log('insertRecord record error:', insertRecordError)
    return new Response(JSON.stringify({ error: insertRecordError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 挿入されたレコードのidを取得
  const recordId = insertRecord[0].record_id;

  // set_detailテーブルに挿入するデータ
  const setDetailsData = recordData.weight.map((weight, index) => ({
    record_id: recordId,
    current_set: index + 1, // 1から始まる連番
    weight: weight,
    reps: recordData.reps[index],
  }))

  // set_detailテーブルにデータを挿入
  const { error: insertSetDetailError } = await supabase
  .from("set_detail")
  .insert(setDetailsData);

  if (insertSetDetailError) {
    console.error('insertRecord set_detail error:', insertSetDetailError);
    return new Response(JSON.stringify({ error: insertSetDetailError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("挿入成功")
  // 成功
  return new Response(JSON.stringify({ message: "Data inserted successfully" }), { // ここを修正
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
  });
}

/**
 * データ取得（記録一覧）
 * @param req 
 * @returns 
 */
async function fetchRecords(req: Request): Promise<Response> {
  const {data, error} = await supabase
  .from("record")
  .select(
    `
      record_id,
      part_master (part_name, part_color),
      menu_master (menu_name),
      set_count,
      set_detail (current_set, weight, reps),
      note,
      create_date
    `
  )
  .order("record_id", { ascending: true })

  // エラーハンドリング
  if (error) {
    console.log('fethcRecords error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
  });
}

/**
 * レコード追加（種目）
 * @param req 
 * @returns 
 */
async function insertMenu(req: Request): Promise<Response> {
  // bodyをJSON形式で取得
  const body = await req.json()
  const partId = JSON.parse(body.partId);
  const menuName = JSON.parse(body.menuName);

  // menu_masterテーブルにデータを挿入する
  const { data, error } = await supabase
  .from("menu_master")
  .insert({
    part_id: partId,
    menu_name: menuName,
  });

  // エラーハンドリング
  if (error) {
    console.log('fethcRecords error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 成功
  return new Response(JSON.stringify({ message: "Data inserted successfully" }), { // ここを修正
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
  });
}

async function deleteRecord(req: Request): Promise<Response> {
  // bodyをJSON形式で取得
  const body = await req.json()
  const recordId = JSON.parse(body.recordId);

  // set_detailテーブルからrecordIdに紐づくデータを削除
  const {error: deleteSetDetailError} = await supabase
  .from("set_detail")
  .delete()
  .eq("record_id", recordId);

  // set_detail削除時のエラーハンドリング
  if (deleteSetDetailError) {
    console.error('deleteRecord set_detail error:', deleteSetDetailError);
    return new Response(JSON.stringify({ error: deleteSetDetailError.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
    });
  }

  // recordテーブルからrecordIdに紐づくデータを削除
  const { error: deleteRecordError } = await supabase
  .from("record")
  .delete()
  .eq("record_id", recordId);

  // record削除時のエラーハンドリング
  if (deleteRecordError) {
    console.error('deleteRecord record error:', deleteRecordError);
    // 注意: ここでエラーが発生した場合、set_detailのデータは削除されています。
    // トランザクション管理が必要な場合は別途実装を検討してください。
    return new Response(JSON.stringify({ error: deleteRecordError.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
    });
  }

  // 成功
  return new Response(JSON.stringify({ message: "Record deleted successfully" }), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
  });
}

/**
 * データ取得（部位）
 * @param req 
 * @returns 
 */
async function fetchOldPart(req: Request): Promise<Response> {
  const {data, error} = await supabase
  .from("old_part_master")
  .select("part_id, part_name, part_color")
  .order("part_id", { ascending: true })

  // エラーハンドリング
  if (error) {
    console.log('fethcOldPart error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
  });
}

/**
 * データ取得（種目）
 * @param req 
 * @returns 
 */
async function fetchOldMenu(req: Request): Promise<Response> {
  const {data, error} = await supabase
  .from("old_menu_master")
  .select("menu_id, part_id, menu_name")
  .order("menu_id", { ascending: true })

  // エラーハンドリング
  if (error) {
    console.log('fethcOldMenu error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
  });
}
/**
 * データ取得（記録一覧）
 * @param req 
 * @returns 
 */
async function fetchOldRecords(req: Request): Promise<Response> {
  const {data, error} = await supabase
  .from("old_record")
  .select(
    `
      record_id,
      old_part_master (part_name, part_color),
      old_menu_master (menu_name),
      set_count,
      old_set_detail (current_set, weight, reps),
      note,
      create_date
    `
  )
  .order("record_id", { ascending: true })

  // エラーハンドリング
  if (error) {
    console.log('fethcOldRecords error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
  });
}