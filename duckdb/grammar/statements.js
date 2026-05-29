import { comma_list, wrapped_in_parenthesis } from '../../grammar/helpers.js';

export default {

  // ATTACH ['file.db'] [AS alias] [(TYPE type, READ_ONLY bool, ...)]
  attach_statement: $ => seq(
    $.keyword_attach,
    optional($.keyword_database),
    optional(field('path', alias($._literal_string, $.literal))),
    optional(seq(
      $.keyword_as,
      field('alias', $.identifier),
    )),
    optional(wrapped_in_parenthesis(
      comma_list(
        seq(
          field('option_name', $.identifier),
          optional(field('option_value', choice($.identifier, alias($._literal_string, $.literal), $.literal))),
        ),
        true,
      ),
    )),
  ),

  // DETACH [DATABASE] alias
  detach_statement: $ => seq(
    $.keyword_detach,
    optional($.keyword_database),
    optional(field('alias', $.identifier)),
  ),

  // INSTALL name [FROM 'url' | FROM community | FROM core]
  install_statement: $ => seq(
    $.keyword_install,
    field('name', choice($.identifier, alias($._literal_string, $.literal))),
    optional(seq(
      $.keyword_from,
      field('source', choice($.identifier, alias($._literal_string, $.literal))),
    )),
  ),

  // LOAD name
  load_statement: $ => seq(
    $.keyword_load,
    field('name', choice($.identifier, alias($._literal_string, $.literal))),
  ),

  // SUMMARIZE table_ref | SUMMARIZE SELECT ...
  summarize_statement: $ => seq(
    $.keyword_summarize,
    choice(
      $.object_reference,
      $._dml_read,
    ),
  ),

};
