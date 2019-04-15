var express = require('express');
var router = express.Router();
var SambaClient = require('samba-client');
var fs = require('fs');

var libs = require('../lib.js');
var lib = new libs();
var config = require('../config.json');

let download_flag = false; //check download action
let upload_flag = false; //check download action
let download_list = [];

var client = new SambaClient({
  address: config.smb.path, // required
  username: config.smb.username, // not required, defaults to guest
  password: config.smb.password, // not required
  domain: config.smb.domain // not required
});
var FTPS = require('ftps');
var ftps = new FTPS({
  host: config.sftp.host,
  username: config.sftp.username,
  password: config.sftp.password,
  protocol: 'sftp',
  port: 22,
  escape: true,
  retries: 2,
  timeout: 10,
  retryInterval: 5,
  retryMultiplier: 1,
  requiresPassword: true, 
  autoConfirm: true,
  cwd: '',
  additionalLftpCommands: '',
  requireSSHKey:  true,
  sshKeyPath: '/home/hudson'
});

ftps.exec((err,res)=>{
  ftp_dir = JSON.stringify(res);
  fs.writeFile('ftp_dir', ftp_dir, (error)=>{});
});
/* GET home page. */
router.get('/', function(req, res, next) {
  download_flag = false; //check download action
  download_list = [];

  res.render('index', { 
    smb_path : "",
    sftp_path : "/home",
    smb_favorite : config.smb_favorite,
    sftp_favorite : config.sftp_favorite,
    smb_default : config.smb.path,
    sftp_default : config.sftp.host
  });
});
router.post('/smb', function(req, res, next){
  var act = req.body.act;
  switch( act ){
    case "get_dir":
      var name = req.body.name;
      var post_path = req.body.path;
      var flag = req.body.flag;

      if( flag == "true" ){
        post_path = name;
      } else {
        if( name === ".." ){
          var dir = post_path.split("/");
          if( dir.length == 1 ){
            post_path = "";
          } else {
            var dir_path = "";
            for( var i=0; i<dir.length-1; i++ ){
              if( i == 0 ){
                dir_path += dir[i];
              } else {
                dir_path += "/"+dir[i];
              }
            }
            post_path = dir_path;
          }
        } else {
          post_path = post_path + "/" + name;
        }
      }
      client.listDirectory(post_path ,function(err, list) {
        if (err) {
          return console.error(err);
        }
        list = lib.smb_ls_parse( list );
        res.send({ 
          list : list,
          folder : post_path,
          favorite : config.smb_favorite
        });
      });
      break;
    case "favorite":
      var post_path = req.body.path;
      var idx = config.smb_favorite.indexOf(post_path);
      if( idx <= -1 ){
        //add
        config.smb_favorite.push(post_path);  
      } else {
        //remove
        config.smb_favorite.splice(idx,1);
      }
      var json = JSON.stringify(config);
      fs.writeFile('config.json', json, (error)=>{});
      res.send(config.smb_favorite);
      break;
  }
});
router.post('/sftp', function(req, res, err){
  var act = req.body.act;
  switch( act ){
    case "get_dir":
      var post_path = req.body.path;
      var name = req.body.name;
      var flag = req.body.flag;
      let ftp_dir = null;

      if( flag == "true" ){
        post_path = name;
      } else {
        if( name !== "" ){
          if( name === ".." ){
            var dir = post_path.split("/");
            if( dir.length == 1 ){
              post_path = "";
            } else {
              var dir_path = "";
              for( var i=0; i<dir.length-1; i++ ){
                if( i == 0 ){
                  dir_path += dir[i];
                } else {
                  dir_path += "/"+dir[i];
                }
              }
              post_path = dir_path;
            }
          } else {
            post_path = post_path + "/" + name;
          }
        }
      }
      ftps.cd(post_path);
      ftps.raw('ls -la');
      ftps.exec((err,res)=>{
        ftp_dir = JSON.stringify(res);
        fs.writeFile('ftp_dir', ftp_dir, (error)=>{});
      });
      res.send({
        success : true,
        folder : post_path
      });
      res.end();
      break;
    case "get_info":
      var file_data;
      file_data = JSON.parse(fs.readFileSync('./ftp_dir', 'utf8'));
      fs.unlink('./ftp_dir');
      res.send({
        data : lib.sftp_ls_parse(file_data),
        favorite : config.sftp_favorite
      });
      res.end();
      break;
    case "favorite":
      var post_path = req.body.path;
      var idx = config.sftp_favorite.indexOf(post_path);
      if( idx <= -1 ){
        //add
        config.sftp_favorite.push(post_path);  
      } else {
        //remove
        config.sftp_favorite.splice(idx,1);
      }
      var json = JSON.stringify(config);
      fs.writeFile('config.json', json, (error)=>{});
      res.send(config.sftp_favorite);
      break;
  }
});

router.post('/file', function(req, res, err){
  var act = req.body.act;

  switch( act ){
    case "get_file":
      var name = req.body.name;
      var path = req.body.path;
      var is_dir = req.body.dir;
      var filename = req.body.filename;
      var smb_path = req.body.smb_current_path;

      download_list = [];

      if( is_dir == "true" ){
        // Smb > Mkdir path
        client.mkdir(smb_path+"/"+filename ,function(err, list) {
          if (err) {
            return console.error(err);
          }
        });

        var sftp_path = path+"/"+name;
        ftps.cd(sftp_path);
        ftps.raw('ls -la');
        download_flag = true;
        ftps.exec((err,res)=>{
          var ftp_dir = lib.sftp_ls_parse(res);
          for( var i=0; i<ftp_dir.length; i++ ){
            if( !ftp_dir[i].dir ){
              var file_name = ftp_dir[i].name;
              ftps.get(path+"/"+name+"/"+file_name, "./download");
              download_list.push(file_name);
            }
          }
          ftps.exec((err,res)=>{
            download_flag = false;
          });
        });
      } else {
        ftps.cd(path);
        ftps.raw('ls -la');
        download_flag = true;
        ftps.exec((err,res)=>{
          ftps.get(path+"/"+name, "./download");
          download_list.push(name);
          ftps.exec((err,res)=>{
            download_flag = false;
          });
        });
      }
      res.send({
        data:"success"
      });
      break;
    case "download_check":
      if( download_flag ){
        // Sftp DownLoad is working
        res.send({
          success:true,
          down_process : download_flag,
          up_process : upload_flag
        });
      } else {
        if( upload_flag ){
          // Smb put Check
          // local download file delete
          var complete_len = 0;
          var files = fs.readdirSync("./download/");
          complete_len = files.length;
          if( complete_len == 0 ){
            upload_flag = false;
          }
          var precent = 100-(complete_len/download_list.length * 100);
          res.send({
            success:true,
            down_process : download_flag,
            up_process : upload_flag,
            progress : precent 
          });
        } else {
          // Stfp DownLoad complete
          // Smb put working
          upload_flag = true;
          var smb_path = req.body.smb_current_path;
          var file_name = req.body.filename;
          var is_dir = false;
          if( download_list.length > 1 ){
            is_dir = true;
          }
          if( is_dir ){
            for( var i=0; i<download_list.length; i++ ){
              client.sendFile("./download/"+download_list[i], smb_path+"/"+file_name+"/"+download_list[i] ,function(err, fin, cmdArgs) {
                if (err) {
                  return console.error(err);
                }
                fs.unlink("./download/"+cmdArgs.split('" "')[0].slice(1,));
              });
            }
          } else { 
            //put...
            client.sendFile("./download/"+download_list[0], smb_path+"/"+file_name,function(err, fin) {
              if (err) {
                return console.error(err);
              }
              fs.unlink("./download/"+download_list[0]);
            });
          }

          res.send({
            success:true,
            down_process : download_flag,
            up_process : upload_flag
          });
        }
      }
      break;
  }
});

module.exports = router;
