##
## Put me in ~/.irssi/scripts, and then execute the following in irssi:
##
##       /load perl
##       /script load notify
##

use strict;
use Irssi;
use vars qw($VERSION %IRSSI);
use HTML::Entities;

$VERSION = "0.5";
%IRSSI = (
    authors     => 'Luke Macken, Paul W. Frields',
    contact     => 'lewk@csh.rit.edu, stickster@gmail.com',
    name        => 'notify.pl',
    description => 'Use D-Bus to alert user to hilighted messages',
    license     => 'GNU General Public License',
    url         => 'http://code.google.com/p/irssi-libnotify',
);

Irssi::settings_add_str('notify', 'notify_remote', '');

sub sanitize {
  my ($text) = @_;
  encode_entities($text,'\'<>&');
  my $apos = "&#39;";
  my $aposenc = "\&apos;";
  $text =~ s/$apos/$aposenc/g;
  $text =~ s/"/\\"/g;
  return $text;
}

sub notify {
    my ($server, $summary, $message) = @_;

    # Make the message entity-safe
    $summary = sanitize($summary);
    $message = sanitize($message);

    my $cmd = "EXEC - " .
    "notify-send -a irssi '" . $summary . "' '". $message . "'";
    $server->command($cmd);

    my $remote = Irssi::settings_get_str('notify_remote');
    if ($remote ne '') {
    my $cmd = "EXEC - ssh -q " . $remote .
        "notify-send -a irssi '" . $summary . "' '". $message . "'";
    $server->command($cmd);
    }

}

sub print_text_notify {
    my ($dest, $text, $stripped) = @_;
    my $server = $dest->{server};
    #my $channel = $dest->{channel};
    return if (!$server || !($dest->{level} & MSGLEVEL_HILIGHT));
    my $sender = $stripped;
    $sender =~ s/^\<?(.+?)\>? .*/\1/ ;
    $stripped =~ s/^.+? +(.*)/\1/ ;
    notify($server, $sender, $stripped);
}

sub message_private_notify {
    my ($server, $msg, $nick, $address) = @_;

    return if (!$server);
    notify($server, "PM from ".$nick, $msg);
}

sub dcc_request_notify {
    my ($dcc, $sendaddr) = @_;
    my $server = $dcc->{server};

    return if (!$dcc);
    notify($server, "DCC ".$dcc->{type}." request", $dcc->{nick});
}

Irssi::signal_add('print text', 'print_text_notify');
Irssi::signal_add('message private', 'message_private_notify');
Irssi::signal_add('dcc request', 'dcc_request_notify');
