#
# Add the statusbar item to its own statusbar with
# /statusbar sb_timezones enable
# /statusbar sb_timezones add -alignment left barstart
# /statusbar sb_timezones add -after barstart timezones
# /statusbar sb_timezones add -alignment right barend
#
# or add it to an existing one with
# /statusbar window add timezones (window is an exaple, see /statusbar and /help statusbar for comprehensive help)

$VERSION = "0.1";
%IRSSI = (
    authors     => "Jari Matilainen",
    contact     => "irc: vague`\@freenode",
    name        => "timezones",
    description => "timezones displayer",
    license     => "Public Domain",
    url         => "http://vague.se"
);

use strict;
use Irssi::TextUI;
use DateTime;

my $refresh_tag;

sub timezones {
  my ($item,$get_size_only) = @_;
  my ($datetime) = Irssi::settings_get_str("timezones_clock_format");
  my ($div) = Irssi::settings_get_str("timezones_divider");
  my (@timezones) = split ' ', Irssi::settings_get_str("timezones");

  my $result = "";

  foreach(@timezones) {
    if(length($result)) { $result .= $div; }
    my ($nick, $timezone) = split /:/, $_;
    my $now = DateTime->now(time_zone => $timezone);
    $result .= $nick . ": " . $now->strftime("$datetime");
  }

  $item->default_handler($get_size_only, undef, $result, 1);
}

sub refresh_timezones {
  Irssi::statusbar_items_redraw('timezones');
}

sub init_timezones {
  Irssi::timeout_remove($refresh_tag) if ($refresh_tag);
  $refresh_tag = Irssi::timeout_add(1000, \&refresh_timezones, undef);
}

Irssi::statusbar_item_register('timezones', '{sb $0-}', 'timezones');
Irssi::settings_add_str('timezones', 'timezones_clock_format', '%H:%M:%S');
Irssi::settings_add_str('timezones', 'timezones_divider', ' ');
Irssi::settings_add_str('timezones', 'timezones', 'Mike:GMT Sergey:EST');

init_timezones();
Irssi::signal_add('setup changed', \&init_timezones);
refresh_timezones();
