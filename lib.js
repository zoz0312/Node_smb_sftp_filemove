function lib(){
    this.sftp_ls_parse = ( data ) =>{
        /* Data format *
        drwxr-xr-x   23 davo     davo         4096 Jan 24 18:56 .
        drwxr-xr-x    5 root     root         4096 Jan 15 17:01 ..
        -rw-------    1 davo     davo          338 Jan 15 17:08 .ICEau thority
        /**/
        
        let str = data.data;
        str = str.split("\n");

        let parse_data = [];
        for( var i=0; i<str.length; i++ ){
            if( str[i] != "" && str[i] != undefined && str[i] != null){
                let obj = new Object();
                if( str[i].slice(0,1) === "d" ){
                    //is directory
                    obj.dir = true;
                } else {
                    //is file
                    obj.dir = false;
                }
                obj.name = str[i].replace(/^[-|\w]{0,10}([\s+\w+]{0,})(:\w+)(\s)/g,"");
                parse_data.push(obj);
            }
        }
        parse_data = this.obj_sort(parse_data);
        return parse_data;
    },
    this.smb_ls_parse = ( data ) =>{
        let fileList = [];
        let lines = data.split('\n');
        for (let i = 0; i < lines.length; i++) {
            let reg = /(\s+)(\W+)D(\s+)/;
            let obj = new Object();
            if( reg.test(lines[i]) ){
                obj.dir = true;
            } else {
                obj.dir = false;
            }
            //Directory
            var file_name = lines[i].trim().replace(/(\s+)(\s+)/,",").split(",");
            var file_str = "";
            for( var j=0; j<file_name.length-1; j++ ){
                file_str+=file_name[j];
            }
            obj.name = file_str;
            fileList.push(obj);
        }
        fileList = this.obj_sort(fileList);
        return fileList;
    },
    this.obj_sort = ( obj ) =>{
        var obj1 = [];
        var obj2 = [];

        for( var i=0; i<obj.length; i++ ){
            if( obj[i].dir ){
                if( obj[i].name === ".." || obj[i].name === "." ){ continue; }
                obj1.push(obj[i]);
            } else {
                obj2.push(obj[i]);
            }
        }
        obj1.sort(( a, b )=>{
            return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
        });
        obj1.unshift({"dir":true,"name":".."});
        obj2.sort(( a, b )=>{
            return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
        });
        return obj1.concat(obj2);
    }
}
module.exports = lib;