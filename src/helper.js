const fs = require('fs');

function awsSSOHelper(configFile, newContent, identifier) {

  // Read the contents of the config file
  fs.readFile(configFile, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    // Find the index of the start of the desired profile
    const startIndex = data.indexOf(identifier);
    if (startIndex === -1) {
      // Profile not found, append the new profile to the end of the file
      fs.appendFile(configFile, `${identifier}\n${newContent}`, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log(`Added new profile ${identifier} to ${configFile}`);
        }
      });
    } else {
      // Find the index of the end of the desired profile
      const endIndex = data.indexOf('[', startIndex + 1);
      if (endIndex === -1) {
        // End of file
        const profileContent = data.substring(startIndex);
        const newProfileContent = `${identifier}\n${newContent}`;
        const newFileContent = data.replace(profileContent, newProfileContent);
        // Write the modified contents back to the file
        fs.writeFile(configFile, newFileContent, (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log(`Modified profile ${identifier} in ${configFile}`);
          }
        });
      } else {
        // Profile found, replace the profile content
        const profileContent = data.substring(startIndex, endIndex);
        const newProfileContent = `${identifier}\n${newContent}`;
        const newFileContent = data.replace(profileContent, newProfileContent);
        // Write the modified contents back to the file
        fs.writeFile(configFile, newFileContent, (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log(`Modified profile ${identifier} in ${configFile}`);
          }
        });
      }
    }
  });
}

module.exports = awsSSOHelper;
