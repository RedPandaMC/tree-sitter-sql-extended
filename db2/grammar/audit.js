import { comma_list } from '../../grammar/helpers.js';

export default {

  // CREATE AUDIT POLICY name CATEGORIES ALL | {cat [, cat ...]} STATUS {BOTH|FAILURE|SUCCESS}
  create_audit_policy: $ => seq(
    $.keyword_create,
    $.keyword_audit,
    $.keyword_policy,
    field('name', $.object_reference),
    $.keyword_categories,
    choice(
      $.keyword_all,
      comma_list($.identifier, true),
    ),
    $.keyword_status,
    choice($.keyword_both, $.keyword_failure, $.keyword_success),
  ),

  // DROP AUDIT POLICY name
  drop_audit_policy: $ => seq(
    $.keyword_drop,
    $.keyword_audit,
    $.keyword_policy,
    field('name', $.object_reference),
  ),

};
