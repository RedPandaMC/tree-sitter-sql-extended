import { paren_list } from '../helpers.js';

// Shared HiveQL-compatible ALTER TABLE rules used by both Spark SQL and Hive SQL.

export default {

  // ALTER TABLE t ADD [IF NOT EXISTS] PARTITION (key=val) [LOCATION path]
  add_partition: $ => seq(
    $.keyword_add,
    optional($._if_not_exists),
    repeat1(
      seq(
        $.keyword_partition,
        paren_list(
          seq($.identifier, '=', $._expression),
          true,
        ),
        optional(seq($.keyword_location, $._literal_string)),
      ),
    ),
  ),

};
