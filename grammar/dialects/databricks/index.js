import vacuum_rules from "./vacuum.js";
import optimize_rules from "./optimize.js";
import restore_rules from "./restore.js";
import grant_rules from "./grant.js";
import drop_rules from "./drop.js";
import describe_rules from "./describe.js";
import show_rules from "./show.js";
import cache_rules from "./cache.js";
import resource_rules from "./resource.js";
import call_rules from "./call.js";
import create_rules from "./create.js";

export default {
  ...vacuum_rules,
  ...optimize_rules,
  ...restore_rules,
  ...grant_rules,
  ...drop_rules,
  ...describe_rules,
  ...show_rules,
  ...cache_rules,
  ...resource_rules,
  ...call_rules,
  ...create_rules,
};
