	
var sql  = "select ca.proj_id as proj_id, ca.ca_name as proj_name, ca.ca_date_start as proj_start, ca.ca_date_end AS proj_end,\n(select COUNT(*)  from rotations r \nwhere r.proj_id = proj_id and r.r_status = 'R' \ngroup by r.proj_id) r_count, \n(select count(*) from rotations r \nwhere r.proj_id = proj_id and r.channel_id = 24) r_rtb_count \nfrom projs ca, clients c, proj_auth caa \nwhere ca.client_id = 12345 and ca.client_id = c.client_id and ca_type = 'zzz' \nand c.agency_id = 0 and ca.client_id = NVL( caa.client_id, ca.client_id) \nand proj_id = NVL( caa.proj_id, proj_id) and caa.contact_id = 7890";
var sql_pp  = require('../pretty-data').pd.sql(sql);
var sql_min  = require('../pretty-data').pd.sqlmin(sql);

console.log('\n==============================================================================\n');
console.log('\n/*------- Original SQL string: -------*/\n\n' + sql + '\n');
console.log('\n/*------- Beautified SQL: -------------*/\n\n' + sql_pp  + '\n');
console.log('\n/*------- Minified SQL: ---------------*/\n\n' + sql_min + '\n');
console.log('\n===============================================================================\n');
