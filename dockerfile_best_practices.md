# Dockerfile Best Practices

* [Official Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
* Organize the slowest least frequently changing stuff at the top, and the most frequently changing at the bottom. Often this means the following phases.
	* *System Installs* - These are slow and don't change often. They are things like your programming language, curl, git, and other main binaries and tools.
	* *Application Installs* - These are the installs which change moderately often and are usually related to your programming language. In example they may be NPM packages, GEMs, or libraries. These change somewhat often, but less than the platform installs.
	* *Setup* - This is the code that requires creating folders, chown, chmod, and whatever is needed to setup your app. Usually these commands complete very quickly, and benefit very little from caching, so they need to occur after all of the above.
	* *Code Copy* - This is the part of repository that contains the main code. It changes every single build. Put it as far down in the Dockerfile as you can.
* If your Dockerfile needs to `git clone` a repository, keep in mind how this interacts with the docker cache. When you `git clone` Docker does not check that the repository has changed or not. It will use the cached layer if all of the steps above it are cached. Often with a `git clone` you want the latest code, to check this in a precise manner you can utilize an ADD statement to the github's ref file which will contain the commit SHA, so if that hasn't changed, it won't re-clone, and if it has it will.
	* See https://github.com/simpleviewinc/sv-deploy-gce/blob/master/Dockerfile#L27 as an example.
* If you still want to keep commands for systems aggregated for organization, you can split them into bash files.
	* `COPY scripts/install_* /app/scripts`
	* `RUN cd /app/scripts && ./install_general.sh && ./install_apache.sh && ./install_php.sh`
	* `COPY scripts/setup_* /app/scripts`
	* `RUN cd /app/scripts && ./setup_general.sh && ./setup_apache.sh && ./setup_php.sh`
	* When using this strategy it is critical to only copy the files prior to use, otherwise if a setup script changes, it will invalidate an install script and now you've broken the cache model.