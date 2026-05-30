import { paren_list } from '../../grammar/helpers.js';

export default {

  // PostgreSQL ALTER TABLE ... ALTER COLUMN with SET STATISTICS / SET STORAGE / SET COMPRESSION
  alter_column: $ => seq(
    $.keyword_alter,
    optional($.keyword_column),
    field('name', $.identifier),
    choice(
      seq(
        choice($.keyword_set, $.keyword_drop),
        $.keyword_not,
        $.keyword_null,
      ),
      seq(
        optional(seq($.keyword_set, $.keyword_data)),
        $.keyword_type,
        field('type', $._type),
      ),
      seq(
        $.keyword_set,
        choice(
          seq($.keyword_statistics, field('statistics', $._integer)),
          seq(
            $.keyword_storage,
            choice(
              $.keyword_plain,
              $.keyword_external,
              $.keyword_extended,
              $.keyword_main,
              $.keyword_default,
            ),
          ),
          seq($.keyword_compression, field('compression_method', $._identifier)),
          seq(paren_list($._key_value_pair, true)),
          seq($.keyword_default, $._expression),
        ),
      ),
      seq($.keyword_drop, $.keyword_default),
    ),
  ),

  // PostgreSQL ALTER INDEX ... ALTER COLUMN n SET STATISTICS n
  alter_index: $ => seq(
    $.keyword_alter,
    $.keyword_index,
    optional($._if_exists),
    $.identifier,
    choice(
      $.rename_object,
      seq(
        $.keyword_alter,
        optional($.keyword_column),
        alias($._natural_number, $.literal),
        $.keyword_set,
        $.keyword_statistics,
        alias($._natural_number, $.literal),
      ),
      seq($.keyword_reset, paren_list($.identifier)),
      seq(
        $.keyword_set,
        choice(
          seq($.keyword_tablespace, $.identifier),
          paren_list(seq($.identifier, '=', field('value', $.literal))),
        ),
      ),
    ),
  ),

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
