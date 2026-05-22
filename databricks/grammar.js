import base from '../grammar.js';
import { optional_parenthesis } from '../grammar/helpers.js';

import vacuum_rules   from './grammar/vacuum.js';
import optimize_rules from './grammar/optimize.js';
import restore_rules  from './grammar/restore.js';
import grant_rules    from './grammar/grant.js';
import drop_rules     from './grammar/drop.js';
import describe_rules from './grammar/describe.js';
import show_rules     from './grammar/show.js';
import cache_rules    from './grammar/cache.js';
import resource_rules from './grammar/resource.js';
import call_rules     from './grammar/call.js';
import create_rules   from './grammar/create.js';

export default grammar(base, {
  name: 'databricks_sql',

  conflicts: $ => [
    [$.object_reference, $._qualified_field],
    [$.field, $._qualified_field],
    [$._column, $._qualified_field],
    [$.object_reference],
    [$.between_expression, $.binary_expression],
    [$.time],
    [$.timestamp],
    [$.from],
    [$.create_sequence],
    [$.alter_sequence],
    [$.create_function],
    [$.create_namespace],
    [$.create_namespace, $.create_function],
    [$.describe_history, $.describe_table],
    [$.describe_detail, $.describe_table],
  ],

  rules: {

    _ddl_statement: $ => choice(
      // Base ANSI SQL DDL
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
      // Databricks CACHE
      $.cache_table,
      $.uncache_table,
      $.clear_cache,
      // Databricks DESCRIBE
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

    _optimize_statement: $ => choice(
      $._compute_stats,
      $._vacuum_table,
      $._optimize_table,
      $._delta_optimize,
      $._spark_analyze,
    ),

    _refresh_statement: $ => choice(
      $.refresh_materialized_view,
      $.refresh_table_databricks,
      $.refresh_function,
    ),

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

    _drop_statement: $ => choice(
      // Base drops
      $.drop_table,
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
      // Databricks drops
      $.drop_table_purge,
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

    // Databricks-specific rule definitions
    ...vacuum_rules,
    ...optimize_rules,
    ...restore_rules,
    ...grant_rules,
    ...drop_rules,
    ...describe_rules,
    ...show_rules,
    ...cache_rules,
    ...resource_rules,
    ...call_rules,
    ...create_rules,

  },
});
