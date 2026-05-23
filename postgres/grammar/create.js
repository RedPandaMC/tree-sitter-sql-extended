import { paren_list } from "../../grammar/helpers.js";

export default {

  create_extension: $ => prec.left(seq(
    $.keyword_create,
    $.keyword_extension,
    optional($._if_not_exists),
    $.identifier,
    optional($.keyword_with),
    optional(seq($.keyword_schema, $.identifier)),
    optional(seq($.keyword_version, choice($.identifier, alias($._literal_string, $.literal)))),
    optional($.keyword_cascade),
  )),

  // Postgres row level security
  create_policy: $ => prec.right(
    seq(
      $.keyword_create,
      $.keyword_policy,
      $.object_reference,
      $.keyword_on,
      $.object_reference,
      optional(
        seq(
          $.keyword_as,
          choice(
            $.keyword_permissive,
            $.keyword_restrictive,
          ),
        ),
      ),
      optional(
        seq(
          $.keyword_for,
          choice(
            $.keyword_all,
            $.keyword_select,
            $.keyword_insert,
            $.keyword_update,
            $.keyword_delete,
          ),
        ),
      ),
      optional(
        seq(
          $.keyword_to,
          choice(
            $.object_reference,
            $.keyword_public,
            $.keyword_current_role,
            $.keyword_current_user,
            $.keyword_session_user,
          ),
          repeat(
            seq(
              ',',
              choice(
                $.object_reference,
                $.keyword_public,
                $.keyword_current_role,
                $.keyword_current_user,
                $.keyword_session_user,
              ),
            ),
          ),
        ),
      ),
      optional(
        seq(
          $.keyword_using,
          $.parenthesized_expression,
        ),
      ),
      optional(
        seq(
          $.keyword_with,
          $.keyword_check,
          $.parenthesized_expression,
        ),
      ),
    ),
  ),

};
