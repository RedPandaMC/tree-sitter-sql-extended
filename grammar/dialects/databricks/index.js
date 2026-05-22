import vacuum_rules from "./vacuum.js";
import optimize_rules from "./optimize.js";
import restore_rules from "./restore.js";
import grant_rules from "./grant.js";

export default {
  ...vacuum_rules,
  ...optimize_rules,
  ...restore_rules,
  ...grant_rules,
};
