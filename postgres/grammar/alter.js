export default {

  // Postgres row level security
  alter_policy: $ => prec.right(
    seq(
      $.keyword_alter,
      $.keyword_policy,
      $.object_reference,
      $.keyword_on,
      $.object_reference,
      choice(
        $.rename_object,
        seq(
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
    ),
  ),

};
