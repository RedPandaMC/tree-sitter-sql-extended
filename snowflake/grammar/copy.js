import { comma_list, wrapped_in_parenthesis } from '../../grammar/helpers.js';

export default {

  // COPY INTO <table> FROM @<stage> [copy_options]
  // COPY INTO @<stage> FROM <table> [copy_options]
  sf_copy_into: $ => seq(
    $.keyword_copy,
    $.keyword_into,
    choice(
      seq(
        $.object_reference,
        $.keyword_from,
        $.sf_stage_ref,
        repeat($.sf_copy_property),
      ),
      seq(
        $.sf_stage_ref,
        $.keyword_from,
        $.object_reference,
        repeat($.sf_copy_property),
      ),
    ),
  ),

  // @stage_name  @~  @%table  @stage/path
  sf_stage_ref: _ => /@[~%a-zA-Z0-9_./]*/,

  // KEY = value  (e.g. FILE_FORMAT = (TYPE = 'CSV'), PURGE = TRUE)
  sf_copy_property: $ => seq(
    $.identifier,
    '=',
    choice(
      wrapped_in_parenthesis(comma_list($.sf_copy_kv, true)),
      $.literal,
      $.identifier,
    ),
  ),

  sf_copy_kv: $ => seq($.identifier, '=', choice($.literal, $.identifier)),

};
