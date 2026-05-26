export default {
  refresh_materialized_view: ($) =>
    prec.right(
      seq(
        $.keyword_refresh,
        $.keyword_materialized,
        $.keyword_view,
        optional($.keyword_concurrently),
        $.object_reference,
        optional(
          choice(
            seq($.keyword_with, $.keyword_data),
            seq($.keyword_with, $.keyword_no, $.keyword_data),
          ),
        ),
      ),
    ),
};
