#!/bin/bash

green="\e[0;92m"
reset="\e[0m"

if [[ -d /opt/suss ]]
then
    echo ""
    echo -e "${green}Running in SUSS vocareum VM... Starting MongoDB...${reset}"
    echo "/opt/suss/mongodbfiles/manualMongo.sh >> /dev/null"
    nohup /opt/suss/mongodbfiles/manualMongo.sh >> /dev/null &
fi

echo ""
echo -e "${green}Entering virtual environment...${reset}"
echo ". venv/bin/activate"
. venv/bin/activate

echo ""
echo -e "${green}Setting up flask enviroment variables...${reset}"
echo "export FLASK_APP=./app.py"
echo "export PYTHONPATH=."
echo "export FLASH_ENV=development"
export FLASK_APP=./app.py
export PYTHONPATH=.
export FLASH_ENV=development

echo ""
echo -e "Executing ${green}'flask run'${reset}..."
flask run