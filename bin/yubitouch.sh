#!/bin/bash

# Bash script for setting or clearing touch requirements for
# cryptographic operations the OpenPGP application on a YubiKey 4.
#
# Author: Alessio Di Mauro <alessio@yubico.com>
# From: https://gist.github.com/a-dma/797e4fa2ac4b5c9024cc

GCA=$(which gpg-connect-agent)
DO=0
UIF=0

PE=$(which pinentry)
PE_PROMPT="SETPROMPT Admin PIN\nGETPIN\nBYE"

if [ -z "$GCA" ]
then
    echo "Can not find gpg-connect-agent. Aborting...";
    exit 1;
fi

if [ $# -lt 2 ] || [ $# -gt 3 ]
then
    echo "Wrong parameters"
    echo "usage: yubitouch {sig|aut|dec} {off|on|fix} [admin_pin]";
    exit 1;
fi

if [ "$1" == "sig" ]
then
    DO="D6"
elif [ "$1" == "dec" ]
then
    DO="D7"
elif [ "$1" == "aut" ]
then
    DO="D8"
else
    echo "Invalid value $1 (must be sig, aut, dec). Aborting..."
    exit 1
fi

if [ "$2" == "off" ]
then
    UIF="00";
elif [ "$2" == "on" ]
then
    UIF="01"
elif [ "$2" == "fix" ]
then
    UIF="02";
else
    echo "Invalid value $2 (must be off, on, fix). Aborting..."
    exit 1
fi

if [ $# -eq 3 ]
then
    PIN="$3"
elif [ -z "$PE" ]
then
    echo -e "Pinentry not present\nFalling back to regular stdin.\nBe careful!"
    echo "Enter your admin PIN: "
    read PIN
else
    PIN="$(echo -e $PE_PROMPT | $PE | sed -n '/^D .*/s/^D //p')"
fi

if [ -z "$PIN" ]
then
    echo "Empty PIN. Aborting..."
    exit 1
fi

PIN_LEN=${#PIN}
PIN_LEN=$(printf %02x $PIN_LEN)

PIN=$(echo -n "$PIN" | xxd -ps | sed 's/[[:xdigit:]]\{2\}/& /g')

$GCA --hex "scd reset" /bye > /dev/null

VERIFY=$($GCA --hex "scd apdu 00 20 00 83 $PIN_LEN $PIN" /bye)
if ! echo $VERIFY | grep -q "90 00"
then
    echo "Verification failed, wrong pin?"
    exit 1
fi

PUT=$($GCA --hex "scd apdu 00 da 00 $DO 02 $UIF 20" /bye)
if ! echo $PUT | grep -q "90 00"
then
    echo "Unable to change mode. Set to fix?"
    exit 1
fi

echo "All done!"
exit 0
