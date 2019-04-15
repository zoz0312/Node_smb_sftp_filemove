# Node_smb_sftp_filemove


## Before Server Startup
ftps node module Link : https://www.npmjs.com/package/ftps

### Windows
```
C:\> choco install lftp
```
### OSX
```
sudo brew install lftp
```
### Linix
```
sudo apt-get install lftp
# or 
sudo yum install lftp
```


## Start Server
### `npm start`
Run Server : port 8080

## Using Node Module
[samba]<br>
`npm i samba-client`<br>
Link Samba to this Server

[sftp]<br>
`npm install ftps`<br>
Link sftp to this Server

## Samba-client [node-module]
must fix
function add to samba-client > index.html
<pre><code>(...)
// add listDirectory
/*
	path: smb path you want ( Ex : listDirectory("/work/..." )
	cb : err function
*/
// Add function listDirctory
SambaClient.prototype.listDirectory = function(path,cb) {
  this.execute('dir', path+'/*', '', function(err, allOutput) {
    if (err && allOutput.match(missingFileRegex)) {
      return cb(null, []);
    } else if (err) {
      return cb(err, allOutput);
    }
    cb(null, allOutput);
	});
};
(...)
// Fixed function runCommand
SambaClient.prototype.runCommand = function(cmd, path, destination, cb) {
  var workingDir   = p.dirname(path);
  var fileName     = '"'+p.basename(path).replace(singleSlash, '\\').replace('"','\"')+'"';
  var cmdArgs      = util.format('%s %s', fileName, '"'+destination.replace('"','\"')+'"');

  this.execute(cmd, cmdArgs, workingDir, cb);
};
(...)
</code></pre>
return ls -la info to `String Type`<br>

## config.json<br>
add your samba & sftp info<br>
<pre><code>{
	"sftp_favorite":[],
	"smb_favorite":[],
	"smb":{
		"path":"",
		"username":"",
		"password":"",
		"domain":"WORKGROUP"
	},
	"sftp":{
		"host":"",
		"username":"",
		"password":""
	}
}
</code></pre>

