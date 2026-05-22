import { optional_parenthesis, wrapped_in_parenthesis } from "../helpers.js";

import create_rules from "./create.js";
import alter_rules from "./alter.js";
import drop_rules from "./drop.js";
import rename_rules from "./rename.js";
import optimize_rules from "./optimize.js";
import merge_rules from "./merge.js";
import comment_rules from "./comment.js";
import delete_rules from "./delete.js";
import insert_rules from "./insert.js";
import update_rules from "./update.js";
import truncate_rules from "./truncate.js";
import copy_rules from "./copy.js";
import select_rules from "./select.js";
import set_rules from "./set.js";
import refresh_rules from "./refresh.js";
import show_rules from "./show.js";
import compound_rules from "./compound.js";

import databricks_rules from "../dialects/databricks/index.js";

export default {

  // Top-level composition rule — the grammar entry point
  statement: $ => seq(
    optional(seq(
      $.keyword_explain,
      optional($.keyword_analyze),
      optional($.keyword_verbose),
    )),
    choice(
      $._ddl_statement,
      $._dml_write,
      optional_parenthesis($._dml_read),
      $.while_statement,
    ),
  ),

  // ===== ALL SPREADS — guaranteed before overrides =====

  ...create_rules,
  ...alter_rules,
  ...drop_rules,
  ...rename_rules,
  ...optimize_rules,
  ...merge_rules,
  ...refresh_rules,
  ...comment_rules,
  ...databricks_rules,
  ...delete_rules,
  ...insert_rules,
  ...update_rules,
  ...truncate_rules,
  ...copy_rules,
  ...select_rules,
  ...set_rules,
  ...show_rules,
  ...compound_rules,

  // ===== ALL OVERRIDES — MUST BE LAST =====
  // These intentionally supersede anything defined in the spreads above.
  // Never add inline rules below this comment unless they are overrides.

  _ddl_statement: $ => choice(
    $._create_statement,
    $._alter_statement,
    $._drop_statement,
    $._rename_statement,
    $._optimize_statement,
    $._merge_statement,
    $._refresh_statement,
    $.comment_statement,
    $.set_statement,
    $.reset_statement,
    $.use_statement,
    // Databricks / Delta / Unity Catalog
    $.restore_table_statement,
    $.convert_to_delta_statement,
    $.fsck_repair_statement,
    $.reorg_table_statement,
    $.generate_statement,
    $.msck_repair_statement,
    $.grant_statement,
    $.revoke_statement,
    $.deny_statement,
    // Databricks CACHE extensions
    $.cache_table,
    $.uncache_table,
    $.clear_cache,
    // Databricks DESCRIBE extensions
    $.describe_table,
    $.describe_history,
    $.describe_detail,
    $.describe_uc_object,
    $.describe_query,
    // Databricks resource management
    $.add_resource_statement,
    $.list_resource_statement,
    // Databricks CALL + EXECUTE IMMEDIATE
    $.call_statement,
    $.execute_immediate_statement,
    // Databricks CREATE extensions
    $.create_namespace,
  ),

  _dml_write: $ => seq(
    seq(
      optional(
        $._cte,
      ),
      choice(
        $._delete_statement,
        $._insert_statement,
        $._update_statement,
        $._truncate_statement,
        $._copy_statement,
      ),
    ),
  ),

  _dml_read: $ => seq(
    optional(optional_parenthesis($._cte)),
    optional_parenthesis(
      choice(
        $._select_statement,
        $.set_operation,
        $._show_statement,
        $._unload_statement,
      ),
    ),
  ),

  // Override _optimize_statement to include Delta OPTIMIZE and Spark ANALYZE TABLE
  _optimize_statement: $ => choice(
    $._compute_stats,
    $._vacuum_table,
    $._optimize_table,
    $._delta_optimize,
    $._spark_analyze,
  ),

  // Override _refresh_statement to include REFRESH TABLE/FUNCTION
  _refresh_statement: $ => choice(
    $.refresh_materialized_view,
    $.refresh_table_databricks,
    $.refresh_function,
  ),

  // Override _show_statement to include Databricks SHOW extensions
  _show_statement: $ => seq(
    $.keyword_show,
    choice(
      $._show_create,
      $.keyword_all,
      $._show_tables,
      $._show_catalogs,
      $._show_namespaces,
      $._show_volumes,
      $._show_grants,
      $._show_uc_list,
      $._show_tblproperties,
      $._show_partitions,
      $._show_columns,
    ),
  ),

  // Override _drop_statement to include Databricks DROP extensions
  _drop_statement: $ => choice(
    $.drop_table,
    $.drop_table_purge,
    $.drop_view,
    $.drop_materialized_view,
    $.drop_index,
    $.drop_type,
    $.drop_schema,
    $.drop_database,
    $.drop_role,
    $.drop_sequence,
    $.drop_extension,
    $.drop_function,
    $.drop_procedure,
    $.drop_catalog,
    $.drop_namespace,
    $.drop_connection,
    $.drop_credential,
    $.drop_external_location,
    $.drop_volume,
    $.drop_share,
    $.drop_recipient,
    $.drop_provider,
    $.drop_policy,
  ),

};
