import { paren_list } from "../../grammar/helpers.js";

export default {

  _alter_table_iceberg_spec: $ => choice(
    // Iceberg BRANCH
    seq(
      $.keyword_create,
      $.keyword_branch,
      optional($._if_not_exists),
      field('branch_name', $.identifier),
      optional(seq($.keyword_as, $.keyword_of, $._expression)),
    ),
    seq(
      $.keyword_drop,
      $.keyword_branch,
      optional($._if_exists),
      field('branch_name', $.identifier),
    ),
    seq(
      $.keyword_alter,
      $.keyword_branch,
      field('branch_name', $.identifier),
      optional(seq($.keyword_as, $.keyword_of, $._expression)),
      optional(seq($.keyword_replace)),
    ),
    // Iceberg TAG
    seq(
      $.keyword_create,
      $.keyword_tag,
      optional($._if_not_exists),
      field('tag_name', $.identifier),
      optional(seq($.keyword_as, $.keyword_of, $._expression)),
    ),
    seq(
      $.keyword_drop,
      $.keyword_tag,
      optional($._if_exists),
      field('tag_name', $.identifier),
    ),
    seq(
      $.keyword_alter,
      $.keyword_tag,
      field('tag_name', $.identifier),
      optional(seq($.keyword_as, $.keyword_of, $._expression)),
      optional(seq($.keyword_replace)),
    ),
    // Iceberg column position
    seq(
      $.keyword_alter,
      optional($.keyword_column),
      field('column', $.identifier),
      $.keyword_position,
      choice(
        seq($.keyword_after, field('after_column', $.identifier)),
        seq($.keyword_first),
      ),
    ),
    // Iceberg column FIRST
    seq(
      $.keyword_alter,
      optional($.keyword_column),
      field('column', $.identifier),
      $.keyword_first,
    ),
    // Iceberg SET LOCATION
    seq(
      $.keyword_set,
      $.keyword_location,
      field('location', alias($._literal_string, $.literal)),
    ),
    // Iceberg SET TBLPROPERTIES
    seq(
      $.keyword_set,
      $.keyword_tblproperties,
      paren_list(seq($.identifier, '=', $._expression), true),
    ),
    // Iceberg UNSET TBLPROPERTIES
    seq(
      $.keyword_unset,
      $.keyword_tblproperties,
      choice(
        paren_list($.identifier, true),
        $.identifier,
      ),
      optional($._if_exists),
    ),
    // Iceberg table WRITE mode
    seq(
      $.keyword_set,
      $.keyword_write,
      choice($.keyword_appends, $.keyword_overwrite),
    ),
    // Iceberg table COMMIT
    seq(
      $.keyword_alter,
      $.keyword_table,
      field('table', $.identifier),
      $.keyword_commit,
      $.keyword_snapshot,
    ),
  ),

};
