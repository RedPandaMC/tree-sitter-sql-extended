import { paren_list } from '../../grammar/helpers.js';

export default {

  // EXECUTE IMMEDIATE 'sql' [USING (v1, v2)]
  // EXECUTE IMMEDIATE :var [USING (v1, v2)]
  sf_execute_immediate: $ => seq(
    $.keyword_execute,
    $.keyword_immediate,
    choice(
      alias($._literal_string, $.literal),
      $.parameter,
    ),
    optional(seq(
      $.keyword_using,
      paren_list($._expression, true),
    )),
  ),

  // EXECUTE TASK task_name
  sf_execute_task: $ => seq(
    $.keyword_execute,
    $.keyword_task,
    $.object_reference,
  ),

};
