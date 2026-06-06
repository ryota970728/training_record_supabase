// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import {createClient} from "npm:@supabase/supabase-js@2.39.3"
import { corsHeaders, buildResponse, buildErrorResponse } from "./responses.ts"
import * as service from "./services.ts"

// supabase接続
const supabaseUrl = Deno.env.get("SUPABASE_URL")
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.split("/").pop()

    switch (path) {
      case "fetchPart":
        return buildResponse(await service.fetchParts(supabase, "part_master"))
      
      case "fetchMenu":
        return buildResponse(await service.fetchMenus(supabase, "menu_master"))
      
      case "fetchRecords":
        return buildResponse(await service.fetchAllRecords(supabase, {
          recordTable: "record",
          partTable: "part_master",
          menuTable: "menu_master",
          detailTable: "set_detail"
        }))

      case "insertRecord": {
        const { record } = await req.json()
        return buildResponse(await service.insertTrainingRecord(supabase, record))
      }

      case "deleteRecord": {
        const body = await req.json()
        const recordId = typeof body.recordId === 'string' ? JSON.parse(body.recordId) : body.recordId
        return buildResponse(await service.deleteTrainingRecord(supabase, recordId))
      }

      case "insertMenu": {
        const body = await req.json()
        const partId = typeof body.partId === 'string' ? JSON.parse(body.partId) : body.partId
        const menuName = typeof body.menuName === 'string' ? JSON.parse(body.menuName) : body.menuName
        return buildResponse(await service.insertMenu(supabase, { partId, menuName }))
      }

      case "fetchOldPart":
        return buildResponse(await service.fetchParts(supabase, "old_part_master"))

      case "fetchOldMenu":
        return buildResponse(await service.fetchMenus(supabase, "old_menu_master"))

      case "fetchOldRecords":
        return buildResponse(await service.fetchAllRecords(supabase, {
          recordTable: "old_record",
          partTable: "old_part_master",
          menuTable: "old_menu_master",
          detailTable: "old_set_detail"
        }))

      default:
        return buildResponse({ error: "Not Found" }, 404)
    }
  } catch (err) {
    return buildErrorResponse(err)
  }
})