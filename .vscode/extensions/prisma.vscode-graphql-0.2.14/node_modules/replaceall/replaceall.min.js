/*!
    replaceall (v0.1.6) 23-04-2015
    (c) Lee Crossley <leee@hotmail.co.uk> (http://ilee.co.uk/)
*/
var replaceall=function(a,b,c){return b=b.replace(/\$/g,"$$$$"),c.replace(new RegExp(a.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|<>\-\&])/g,"\\$&"),"g"),b)};"undefined"!=typeof exports&&("undefined"!=typeof module&&module.exports&&(exports=module.exports=replaceall),exports.replaceall=replaceall);