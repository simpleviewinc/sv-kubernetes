scripts.monitor = async function(args) {
	var setTimeoutP = util.promisify(setTimeout);
	var proxy = child_process.spawn(`kubectl`, ["proxy"], { stdio : "inherit" });
	
	// wait for the proxy to boot
	await setTimeoutP(100);
	
	var temp = request.get("http://localhost:8001/api/v1/namespaces/default/events?watch=true");
	
	var watched = {};
	
	var updateWatchers = function() {
		console.log("update watchers");
		var temp = child_process.execSync(`kubectl get pods --no-headers`).toString().split("\n");
		temp.pop();
		
		var pods = temp.map(val => val.split(" ")[0]);
		
		pods.forEach(function(val, i) {
			if (watched[val] === undefined) {
				console.log(`Adding watcher for pod ${val}`);
				var child = child_process.spawn(`kubectl`, ["logs", val, "-f"], { stdio : "inherit" });
				child.on("close", function(code) {
					console.log(`pod closing ${val} ${code}`);
					updateWatchers();
				});
				
				watched[val] = child;
			}
		});
		
		for(var i in watched) {
			if (pods.includes(i) === false) {
				watched[i].kill();
				delete watched[i];
			}
		}
	}
	
	temp.on("data", function(e) {
		updateWatchers();
	});
	
	updateWatchers();
}