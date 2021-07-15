## Notes to potentially add to Readme about installing IPYCMC for local development on Windows:
If you are installing ipycmc on a Microsoft Windows Operating System, it is advised to download Windows Subsystem for Linux (WSL). If you chose not to download WSL, you may encounter file path problems in the webpack.config.js file. <br>
Follow these instructions for downloading Windows Subsystem for Linux: <br>
[https://docs.microsoft.com/en-us/windows/wsl/install-win10](https://docs.microsoft.com/en-us/windows/wsl/install-win10) <br>
After you install your Linux distribution, you must install conda. Follow these instructions: <br>
1. Find the most up-to-date Linux installer at [https://repo.anaconda.com/archive/](https://repo.anaconda.com/archive/)
2. In your terminal, run `wget https://repo.anaconda.com/archive/Anaconda3-20xx.xx-Linux-x86_64.sh` where 20xx.xx is the year and month of the release of the Linux installer. (i.e.  `wget https://repo.anaconda.com/archive/Anaconda3-2021.05-Linux-x86_64.sh`). To run this command you may need to disconnect from a VPN.
3. Give the downloaded file executive permissions by runnning: `chmod +x Anaconda3-20xx.xx-Linux-x86_64.sh`
4. Run `sh ./Anaconda3-20xx.xx-Linux-x86_64.sh`
5. Now run all the commands from the readme at [https://github.com/MAAP-Project/maap-jupyter-ide/tree/master/ipycmc](https://github.com/MAAP-Project/maap-jupyter-ide/tree/master/ipycmc) normally except before the `jupyter labextension install ipycmc` command, run `cd ..`
    
### Development in Visual Studio Code
If you would like to modify your code in Visual Studio Code, then follow the steps at this link: [https://code.visualstudio.com/docs/remote/wsl](https://code.visualstudio.com/docs/remote/wsl)

### Troubleshooting:
* Make sure that Windows Subsystem for Linux is enabled. Do this by:
    * Going to Apps & Features in Settings
    * Under the Related Settings header, go to Programs and Features
	* Turn Windows features on or off
  * Make sure the box next to Windows Subsystem for Linux is clicked

* If conda still does not work, try exporting the path: `export PATH=/home/USER/anaconda3/bin:$PATH`
