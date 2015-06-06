use Irssi;
use strict;

use vars qw($VERSION %IRSSI);

$VERSION="0.3.10";
%IRSSI = (
	authors=> 'BC-bd',
	contact=> 'bd@bc-bd.org',
	name=> 'nm',
	description=> 'right aligned nicks depending on longest nick',
	license=> 'GPL v2',
	url=> 'http://bc-bd.org/blog/irssi/',
);

# $Id: 9cb009e8b7e6f5ce60294334faf88715ef01413e $
# nm.pl
# for irssi 0.8.4 by bd@bc-bd.org
#
# right aligned nicks depending on longest nick
#
# inspired by neatmsg.pl from kodgehopper <kodgehopper@netscape.net
# formats taken from www.irssi.de
# thanks to adrianel <adrinael@nuclearzone.org> for some hints
# thanks to Eric Wald <eswald@gmail.com> for the left alignment patch
# inspired by nickcolor.pl by Timo Sirainen and Ian Peters
# thanks to And1 <and1@meinungsverstaerker.de> for a small patch
# thanks to berber@tzi.de for the save/load patch
# thanks to Dennis Heimbert <dennis.heimbert@gmail.com> for a bug report/patch
#
#########
# USAGE
###
# 
# use
# 
# 	/neatcolor help
#
# for help on available commands
#
#########
# OPTIONS
#########

my $help = "
/set neat_colorize <ON|OFF>
    * ON  : colorize nicks
    * OFF : do not colorize nicks

/set neat_colors <string>
    Use these colors when colorizing nicks, eg:

        /set neat_colors yYrR

    See the file formats.txt on an explanation of what colors are
    available.

/set neat_left_actions <ON|OFF>
    * ON  : print nicks left-aligned on actions
    * OFF : print nicks right-aligned on actions

/set neat_left_messages <ON|OFF>
    * ON  : print nicks left-aligned on messages
    * OFF : print nicks right-aligned on messages

/set neat_right_mode <ON|OFF>
    * ON  : print the mode of the nick e.g @%+ after the nick
    * OFF : print it left of the nick 

/set neat_maxlength <number>
    * number : Maximum length of Nicks to display. Longer nicks are truncated.
    * 0      : Do not truncate nicks.

/set neat_melength <number>
    * number : number of spaces to substract from /me padding

/set neat_ignorechars <str>
    * str : regular expression used to filter out unwanted characters in
            nicks. this can be used to assign the same color for similar
            nicks, e.g. foo and foo_:

                /set neat_ignorechars [_]

/set neat_allow_shrinking <ON|OFF>
    * ON  : shrink padding when longest nick disappears
    * OFF : do not shrink, only allow growing
 
";

#
###
################
###
#
# Changelog
#
# Version 0.3.10
#  - fix losing of saved color when changing nick shares more than one channel
#    with you
#
# Version 0.3.9
#  - fix longest nick calculation for nicks shorter than the current longest
#    nick
#  - updated url
#
# Version 0.3.8
#  - fixed error in the nickchange tracking code, reported by Kevin Ballard
#  - added --all switch to reset command
#  - skip broken lines in saved_colors
#
# Version 0.3.7
#  - fixed crash when calling /neatcolor without parameters
#  - fixed url
#
# Version 0.3.6
#  - added option to ignore certain characters from color hash building, see
#    https://bc-bd.org/trac/irssi/ticket/22
#  - added option to save and specify colors for nicks, see
#    https://bc-bd.org/trac/irssi/ticket/23
#  - added option to disallow shrinking, see
#    https://bc-bd.org/trac/irssi/ticket/12
#
# Version 0.3.5
#  - now also aligning own messages in queries
#
# Version 0.3.4
#  - fxed off by one error in nick_to_color, patch by jrib, see
#  https://bc-bd.org/trac/irssi/ticket/24
#
# Version 0.3.3
#  - added support for alignment in queries, see
#    https://bc-bd.org/trac/irssi/ticket/21
#
# Version 0.3.2
#  - integrated left alignment patch from Eric Wald <eswald@gmail.com>, see
#    https://bc-bd.org/trac/irssi/ticket/18
#
# Version 0.3.1
#  - /me padding, see https://bc-bd.org/trac/irssi/ticket/17
#
# Version 0.3.0
#  - integrate nick coloring support
#
# Version 0.2.1
#  - moved neat_maxlength check to reformat() (thx to Jerome De Greef <jdegreef@brutele.be>)
#
# Version 0.2.0
#  - by adrianel <adrinael@nuclearzone.org>
#     * reformat after setup reload
#     * maximum length of nicks
#
# Version 0.1.0
#  - got lost somewhere
#
# Version 0.0.2
#  - ugly typo fixed
#  
# Version 0.0.1
#  - initial release
#
###
################
###
#
# BUGS
#
# Empty nicks, eg "<> message"
# 	This seems to be triggered by some themes. As of now there is no known
# 	fix other than changing themes, see
# 	https://bc-bd.org/trac/irssi/ticket/19
#
# Well, it's a feature: due to the lacking support of extendable themes
# from irssi it is not possible to just change some formats per window.
# This means that right now all windows are aligned with the same nick
# length, which can be somewhat annoying.
# If irssi supports extendable themes, I will include per-server indenting
# and a setting where you can specify servers you don't want to be indented
#
###
################

my ($longestNick, %saved_colors, @colors, $alignment, $sign, %commands);

my $colorize = -1;

sub reformat() {
	my $max = Irssi::settings_get_int('neat_maxlength');
	my $actsign = Irssi::settings_get_bool('neat_left_actions')? '': '-';
	$sign = Irssi::settings_get_bool('neat_left_messages')? '': '-';

	if ($max && $max < $longestNick) {
		$longestNick = $max;
	}

	my $me = $longestNick - Irssi::settings_get_int('neat_melength');
	$me = 0 if ($me < 0);

	Irssi::command('^format own_action {ownaction $['.$actsign.$me.']0} $1');
	Irssi::command('^format action_public {pubaction $['.$actsign.$me.']0}$1');
	Irssi::command('^format action_private {pvtaction $['.$actsign.$me.']0}$1');
	Irssi::command('^format action_private_query {pvtaction_query $['.$actsign.$me.']0} $2');

	my $length = $sign . $longestNick;
	if (Irssi::settings_get_bool('neat_right_mode') == 0) {
		Irssi::command('^format own_msg {ownmsgnick $2 {ownnick $['.$length.']0}}$1');
		Irssi::command('^format own_msg_channel {ownmsgnick $3 {ownnick $['.$length.']0}{msgchannel $1}}$2');
		Irssi::command('^format pubmsg_me {pubmsgmenick $2 {menick $['.$length.']0}}$1');
		Irssi::command('^format pubmsg_me_channel {pubmsgmenick $3 {menick $['.$length.']0}{msgchannel $1}}$2');
		Irssi::command('^format pubmsg_hilight {pubmsghinick $0 $3 $['.$length.']1%n}$2');
		Irssi::command('^format pubmsg_hilight_channel {pubmsghinick $0 $4 $['.$length.']1{msgchannel $2}}$3');
		Irssi::command('^format pubmsg {pubmsgnick $2 {pubnick $['.$length.']0}}$1');
		Irssi::command('^format pubmsg_channel {pubmsgnick $2 {pubnick $['.$length.']0}}$1');
	} else {
		Irssi::command('^format own_msg {ownmsgnick {ownnick $['.$length.']0$2}}$1');
		Irssi::command('^format own_msg_channel {ownmsgnick {ownnick $['.$length.']0$3}{msgchannel $1}}$2');
		Irssi::command('^format pubmsg_me {pubmsgmenick {menick $['.$length.']0}$2}$1');
		Irssi::command('^format pubmsg_me_channel {pubmsgmenick {menick $['.$length.']0$3}{msgchannel $1}}$2');
		Irssi::command('^format pubmsg_hilight {pubmsghinick $0 $0 $['.$length.']1$3%n}$2');
		Irssi::command('^format pubmsg_hilight_channel {pubmsghinick $0 $['.$length.']1$4{msgchannel $2}}$3');
		Irssi::command('^format pubmsg {pubmsgnick {pubnick $['.$length.']0$2}}$1');
		Irssi::command('^format pubmsg_channel {pubmsgnick {pubnick $['.$length.']0$2}}$1');
	}

	# format queries
	Irssi::command('^format own_msg_private_query {ownprivmsgnick {ownprivnick $['.$length.']2}}$1');
	Irssi::command('^format msg_private_query {privmsgnick $['.$length.']0}$2');
};

sub findLongestNick {
	$longestNick = 0;

	# get own nick length
	map {
		my $len = length($_->{nick});

		$longestNick = $len if ($len > $longestNick);
	} Irssi::servers();

	# find longest other nick
	foreach (Irssi::channels()) {
		foreach ($_->nicks()) {
			my $len = length($_->{nick});

			$longestNick = $len if ($len > $longestNick);
		}
	}

	reformat();
}

# a new nick was created
sub sig_newNick
{
	my ($channel, $nick) = @_;

	my $len = length($nick->{nick});

	if ($len > $longestNick) {
		$longestNick = $len;
		reformat();
	}

	return if (exists($saved_colors{$nick->{nick}}));

	$saved_colors{$nick->{nick}} = "%".nick_to_color($nick->{nick});
}

# something changed
sub sig_changeNick
{
	my ($channel, $nick, $old_nick) = @_;

	# if no saved color exists, we already handled this nickchange. irssi
	# generates one signal per channel the nick is in, so if you share more
	# than one channel with this nick, you'd lose the coloring.
	return unless exists($saved_colors{$old_nick});

	# we need to update the saved colorors hash independent of nick lenght
	$saved_colors{$nick->{nick}} = $saved_colors{$old_nick};
	delete $saved_colors{$old_nick};

	my $new = length($nick->{nick});

	# in case the new nick is longer than the old one, simply remember this
	# as the new longest nick and reformat.
	#
	# if the new nick is as long as the known longest nick nothing has to be
	# done
	#
	# if the new nick is shorter than the current longest one and if the
	# user allows us to shrink, find new longest nick and reformat.
	if ($new > $longestNick) {
		$longestNick = $new;
	} elsif ($new == $longestNick) {
		return;
	} else {
		return unless Irssi::settings_get_bool('neat_allow_shrinking');
		findLongestNick();
	}

	reformat();
}

sub sig_removeNick
{
	my ($channel, $nick) = @_;

	my $thisLen = length($nick->{nick});

	# we only need to recalculate if this was the longest nick and we are
	# allowed to shrink
	if ($thisLen == $longestNick && Irssi::settings_get_bool('neat_allow_shrinking')) {
		findLongestNick();
		reformat();
	}

	# we do not remove a known color for a gone nick, as they may return
}

# based on simple_hash from nickcolor.pl
sub nick_to_color($) {
	my ($string) = @_;
	chomp $string;

	my $ignore = Irssi::settings_get_str("neat_ignorechars");
	$string =~ s/$ignore//g;

	my $counter;
	foreach my $char (split(//, $string)) {
		$counter += ord $char;
	}

	return $colors[$counter % ($#colors + 1)];
}

sub color_left($) {
	Irssi::command('^format pubmsg {pubmsgnick $2 {pubnick '.$_[0].'$['.$sign.$longestNick.']0}}$1');
	Irssi::command('^format pubmsg_channel {pubmsgnick $2 {pubnick '.$_[0].'$['.$sign.$longestNick.']0}}$1');
}

sub color_right($) {
	Irssi::command('^format pubmsg {pubmsgnick {pubnick '.$_[0].'$['.$sign.$longestNick.']0}$2}$1');
	Irssi::command('^format pubmsg_channel {pubmsgnick {pubnick '.$_[0].'$['.$sign.$longestNick.']0}$2}$1');
}

sub sig_public {
	my ($server, $msg, $nick, $address, $target) = @_;

	&$alignment($saved_colors{$nick});
}

sub sig_setup {
	@colors = split(//, Irssi::settings_get_str('neat_colors'));

	# check left or right alignment
	if (Irssi::settings_get_bool('neat_right_mode') == 0) {
		$alignment = \&color_left;
	} else {
		$alignment = \&color_right;
	}
	
	# check if we switched coloring on or off
	my $new = Irssi::settings_get_bool('neat_colorize');
	if ($new != $colorize) {
		if ($new) {
			Irssi::signal_add('message public', 'sig_public');
		} else {
			if ($colorize >= 0) {
				Irssi::signal_remove('message public', 'sig_public');
			}
		}
	}
	$colorize = $new;

	reformat();
	&$alignment('%w');
}

# make sure that every nick has an assigned color
sub assert_colors() {
	foreach (Irssi::channels()) {
		foreach ($_->nicks()) {
			next if (exists($saved_colors{$_->{nick}}));

			$saved_colors{$_->{nick}} = "%".nick_to_color($_->{nick});
		}
	}
}

# load colors from file
sub load_colors() {
	open(FID, "<".$ENV{HOME}."/.irssi/saved_colors") || return;

	while (<FID>) {
		chomp;
		my ($k, $v) = split(/:/);

		# skip broken lines, those may have been introduced by nm.pl
		# version 0.3.7 and earlier
		if ($k eq '' || $v eq '') {
			neat_log(Irssi::active_win(), "Warning, broken line in saved_colors file, skipping '$k:$v'");
			next;
		}

		$saved_colors{$k} = $v;
	}

	close(FID);
}

# save colors to file
sub save_colors() {
	open(FID, ">".$ENV{HOME}."/.irssi/saved_colors");

	print FID $_.":".$saved_colors{$_}."\n" foreach (keys(%saved_colors));

	close(FID);
}

# log a line to a window item
sub neat_log($@) {
	my ($witem, @text) = @_;

	$witem->print("nm.pl: ".$_) foreach(@text);
}

# show available colors
sub cmd_neatcolor_colors($) {
	my ($witem, undef, undef) = @_;

	neat_log($witem, "Available colors: ".join("", map { "%".$_.$_ } @colors));
}

# display the configured color for a nick
sub cmd_neatcolor_get() {
	my ($witem, $nick, undef) = @_;

	if (!exists($saved_colors{$nick})) {
		neat_log($witem, "Error: no such nick '$nick'");
		return;
	}

	neat_log($witem, "Color for ".$saved_colors{$nick}.$nick);
}

# display help
sub cmd_neatcolor_help() {
	my ($witem, $cmd, undef) = @_;

	if ($cmd) {
		if (!exists($commands{$cmd})) {
			neat_log($witem, "Error: no such command '$cmd'");
			return;
		}

		if (!exists($commands{$cmd}{verbose})) {
			neat_log($witem, "No additional help for '$cmd' available");
			return;
		}

		neat_log($witem, ( "", "Help for ".uc($cmd), "" ) );
		neat_log($witem, @{$commands{$cmd}{verbose}});
		return;
	}

	neat_log($witem, split(/\n/, $help));
	neat_log($witem, "Available options for /neatcolor");
	neat_log($witem, "    ".$_.": ".$commands{$_}{text}) foreach(sort(keys(%commands)));

	my @verbose;
	foreach (sort(keys(%commands))) {
		push(@verbose, $_) if exists($commands{$_}{verbose});
	}

	neat_log($witem, "Verbose help available for: '".join(", ", @verbose)."'");
}

# list configured nicks
sub cmd_neatcolor_list() {
	my ($witem, undef, undef) = @_;

	neat_log($witem, "Configured nicks: ".join(", ", map { $saved_colors{$_}.$_ } sort(keys(%saved_colors))));
}

# reset a nick to its default color
sub cmd_neatcolor_reset() {
	my ($witem, $nick, undef) = @_;

	if ($nick eq '--all') {
		%saved_colors = ();
		assert_colors();
		neat_log($witem, "Reset all colors");
		return;
	}

	if (!exists($saved_colors{$nick})) {
		neat_log($witem, "Error: no such nick '$nick'");
		return;
	}

	$saved_colors{$nick} = "%".nick_to_color($nick);
	neat_log($witem, "Reset color for ".$saved_colors{$nick}.$nick);
}

# save configured colors to disk
sub cmd_neatcolor_save() {
	my ($witem, undef, undef) = @_;

	save_colors();

	neat_log($witem, "color information saved");
}

# set a color for a nick
sub cmd_neatcolor_set() {
	my ($witem, $nick, $color) = @_;

	my @found = grep(/$color/, @colors);
	if ($#found) {
		neat_log($witem, "Error: trying to set unknown color '%$color$color%n'");
		cmd_neatcolor_colors($witem);
		return;
	}

	if ($witem->{type} ne "CHANNEL" && $witem->{type} ne "QUERY") {
		neat_log($witem, "Warning: not a Channel/Query, can not check nick!");
		neat_log($witem, "Remember, nicks are case sensitive to nm.pl");
	} else {
		my @nicks = grep(/^$nick$/i, map { $_->{nick} } ($witem->nicks()));

		if ($#nicks < 0) {
			neat_log($witem, "Warning: could not find nick '$nick' here");
		} else {
			if ($nicks[0] ne $nick) {
				neat_log($witem, "Warning: using '$nicks[0]' instead of '$nick'");
				$nick = $nicks[0];
			}
		}
	}

	$saved_colors{$nick} = "%".$color;
	neat_log($witem, "Set color for $saved_colors{$nick}$nick");
}

%commands = (
	colors => {
		text => "show available colors",
		verbose => [
			"COLORS",
			"",
			"displays all available colors",
			"",
			"You can restrict/define the list of available colors ".
			"with the help of the neat_colors setting"
		],
		func => \&cmd_neatcolor_colors,
	},
	get => {
		text => "retrieve color for a nick",
		verbose => [
			"GET <nick>",
			"",
			"displays color used for <nick>"
		],
		func => \&cmd_neatcolor_get,
	},
	help => {
		text => "print this help message",
		func => \&cmd_neatcolor_help,
	},
	list => {
		text => "list configured nick/color pairs",
		func => \&cmd_neatcolor_list,
	},
	reset => {
		text => "reset color to default",
		verbose => [
			"RESET --all|<nick>",
			"",
			"resets the color used for all nicks or for <nick> to ",
			"its internal default",
		],
		func => \&cmd_neatcolor_reset,
	},
	save => {
		text => "save color information to disk",
		verbose => [
			"SAVE",
			"",
			"saves color information to disk, so that it survives ".
			"an irssi restart.",
			"",
			"Color information will be automatically saved on /quit",
		],
		func => \&cmd_neatcolor_save,
	},
	set => {
		text => "set a specific color for a nick",
		verbose => [
			"SET <nick> <color>",
			"",
			"use <color> for <nick>",
			"",
			"This command will perform a couple of sanity checks, ".
			"when called from a CHANNEL/QUERY window",
			"",
			"EXAMPLE:",
			"  /neatcolor set bc-bd r",
			"",
			"use /neatcolor COLORS to see available colors"
		],
		func => \&cmd_neatcolor_set,
	},
);

# the main command callback that gets called for all neatcolor commands
sub cmd_neatcolor() {
	my ($data, $server, $witem) = @_;
	my ($cmd, $nick, $color) = split (/ /, $data);

	$cmd = lc($cmd);

	# make sure we have a valid witem to print text to
	$witem = Irssi::active_win() unless ($witem);

	if (!exists($commands{$cmd})) {
		neat_log($witem, "Error: unknown command '$cmd'");
		&{$commands{"help"}{"func"}}($witem) if (exists($commands{"help"}));
		return;
	}

	&{$commands{$cmd}{"func"}}($witem, $nick, $color);
}

Irssi::settings_add_bool('misc', 'neat_left_messages', 0);
Irssi::settings_add_bool('misc', 'neat_left_actions', 0);
Irssi::settings_add_bool('misc', 'neat_right_mode', 1);
Irssi::settings_add_int('misc', 'neat_maxlength', 0);
Irssi::settings_add_int('misc', 'neat_melength', 2);
Irssi::settings_add_bool('misc', 'neat_colorize', 1);
Irssi::settings_add_str('misc', 'neat_colors', 'rRgGyYbBmMcC');
Irssi::settings_add_str('misc', 'neat_ignorechars', '');
Irssi::settings_add_bool('misc', 'neat_allow_shrinking', 1);

Irssi::command_bind('neatcolor', 'cmd_neatcolor');

Irssi::signal_add('nicklist new', 'sig_newNick');
Irssi::signal_add('nicklist changed', 'sig_changeNick');
Irssi::signal_add('nicklist remove', 'sig_removeNick');

Irssi::signal_add('setup changed', 'sig_setup');
Irssi::signal_add_last('setup reread', 'sig_setup');

findLongestNick();
sig_setup;

load_colors();
assert_colors();

# we need to add this signal _after_ the colors have been loaded, to make sure
# no race condition exists wrt color saving
Irssi::signal_add('gui exit', 'save_colors');
