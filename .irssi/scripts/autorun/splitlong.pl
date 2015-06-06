# /set splitlong_max_length
#   specifies the maximum length of a msg, automatically chosen when set to "0"
#   default: 0
#
# /set splitlong_line_start
# /set splitlong_line_end
#   self-explanatory
#   defaults: "... ", " ..."
###
use strict;
use vars qw($VERSION %IRSSI);

use Irssi 20011001;

$VERSION = "0.20";
%IRSSI = (
	authors     => "Bjoern \'fuchs\' Krombholz",
	contact     => "bjkro\@gmx.de",
	name        => "splitlong",
	license     => "Public Domain",
	description => "Split overlong PRIVMSGs to msgs with length allowed by ircd",
	changed     => "Wed Jun 25 00:17:00 CET 2003",
	changes     => "Actually the real 0.19 (now 0.20), but upload didn't work some month ago, target problem fixed..."
);

sub sig_command_msg {
	my ($cmd, $server, $winitem) = @_;
	my ( $param, $target,$data) = $cmd =~ /^(-\S*\s)?(\S*)\s(.*)/;
    
	my $maxlength = Irssi::settings_get_int('splitlong_max_length');
	my $lstart    = Irssi::settings_get_str('splitlong_line_start');
	my $lend      = Irssi::settings_get_str('splitlong_line_end');

	if ($maxlength == 0) {
		# 497 = 510 - length(":" . "!" . " PRIVMSG " . " :");
		$maxlength = 497 - length($server->{nick} . $server->{userhost} . $target);
	}
	my $maxlength2 = $maxlength - length($lend);

	if (length($data) > ($maxlength)) {
		my @spltarr;

		while (length($data) > ($maxlength2)) {
			my $pos = rindex($data, " ", $maxlength2);
			push @spltarr, substr($data, 0, ($pos < ($maxlength/10 + 4)) ? $maxlength2  : $pos)  . $lend;
			$data = $lstart . substr($data, ($pos < ($maxlength/10 + 4)) ? $maxlength2 : $pos+1);
		}

		push @spltarr, $data;
		foreach (@spltarr) {
			Irssi::signal_emit("command msg", "$target $_", $server, $winitem);
		}
		Irssi::signal_stop();
	}
}

Irssi::settings_add_int('misc', 'splitlong_max_length', 0);
Irssi::settings_add_str('misc', 'splitlong_line_start', "... ");
Irssi::settings_add_str('misc', 'splitlong_line_end', " ...");
Irssi::command_bind('msg', 'sig_command_msg');
