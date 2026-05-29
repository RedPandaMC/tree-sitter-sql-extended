export default {

  // USE SECONDARY ROLES ALL | NONE
  use_secondary_roles: $ => seq(
    $.keyword_use,
    $.keyword_secondary,
    $.keyword_roles,
    choice(
      $.keyword_all,
      $.keyword_none,
    ),
  ),

};
