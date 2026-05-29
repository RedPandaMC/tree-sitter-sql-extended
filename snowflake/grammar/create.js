import { paren_list } from '../../grammar/helpers.js';

export default {

  // CREATE [OR REPLACE] STREAM [IF NOT EXISTS] name ON TABLE table_name
  create_stream: $ => seq(
    $.keyword_create,
    optional($._or_replace),
    $.keyword_stream,
    optional($._if_not_exists),
    $.object_reference,
    $.keyword_on,
    $.keyword_table,
    $.object_reference,
  ),

  // CREATE [OR REPLACE] TASK [IF NOT EXISTS] name
  //   SCHEDULE = 'cron_expr'
  //   [WAREHOUSE = wh_name]
  //   AS query
  create_task: $ => seq(
    $.keyword_create,
    optional($._or_replace),
    $.keyword_task,
    optional($._if_not_exists),
    $.object_reference,
    $.keyword_schedule,
    '=',
    alias($._literal_string, $.literal),
    optional(seq($.keyword_warehouse, '=', $.identifier)),
    repeat($.task_property),
    $.keyword_as,
    $._dml_read,
  ),

  task_property: $ => seq(
    $.identifier,
    '=',
    choice(
      alias($._literal_string, $.literal),
      $.identifier,
    ),
  ),

  // CREATE [OR REPLACE] DYNAMIC TABLE [IF NOT EXISTS] name
  //   TARGET_LAG = 'lag_interval'
  //   WAREHOUSE = wh_name
  //   AS query
  create_dynamic_table: $ => seq(
    $.keyword_create,
    optional($._or_replace),
    $.keyword_dynamic,
    $.keyword_table,
    optional($._if_not_exists),
    $.object_reference,
    $.keyword_target_lag,
    '=',
    alias($._literal_string, $.literal),
    $.keyword_warehouse,
    '=',
    $.identifier,
    $.keyword_as,
    $._dml_read,
  ),

  // CREATE [OR REPLACE] SECURE VIEW [IF NOT EXISTS] name AS query
  create_secure_view: $ => seq(
    $.keyword_create,
    optional($._or_replace),
    $.keyword_secure,
    $.keyword_view,
    optional($._if_not_exists),
    $.object_reference,
    optional(paren_list($.identifier)),
    $.keyword_as,
    $.create_query,
  ),

  // CREATE [OR REPLACE] MASKING POLICY [IF NOT EXISTS] name
  //   AS (param TYPE [, ...]) RETURNS return_type -> body_expr
  create_masking_policy: $ => seq(
    $.keyword_create,
    optional($._or_replace),
    $.keyword_masking,
    $.keyword_policy,
    optional($._if_not_exists),
    $.object_reference,
    $.keyword_as,
    paren_list($.policy_param, true),
    $.keyword_returns,
    $._type,
    '->',
    $._expression,
  ),

  // CREATE [OR REPLACE] ROW ACCESS POLICY [IF NOT EXISTS] name
  //   AS (param TYPE [, ...]) RETURNS BOOLEAN -> body_expr
  create_row_access_policy: $ => seq(
    $.keyword_create,
    optional($._or_replace),
    $.keyword_row,
    $.keyword_access,
    $.keyword_policy,
    optional($._if_not_exists),
    $.object_reference,
    $.keyword_as,
    paren_list($.policy_param, true),
    $.keyword_returns,
    $.keyword_boolean,
    '->',
    $._expression,
  ),

  // param_name TYPE  (used in MASKING POLICY / ROW ACCESS POLICY signatures)
  policy_param: $ => seq($.identifier, $._type),

};
