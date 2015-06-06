use strict; # use warnings;

# {{{ debug

#BEGIN {
#	open STDERR, '>', '/home/ailin/wlstatwarnings';
#};

# FIXME COULD SOMEONE PLEASE TELL ME HOW TO SHUT UP
#
# ...
# Variable "*" will not stay shared at (eval *) line *.
# Variable "*" will not stay shared at (eval *) line *.
# ...
# Can't locate package Irssi::Nick for @Irssi::Irc::Nick::ISA at (eval *) line *.
# ...
#
# THANKS

# }}}

# if you don't know how to operate folds, type zn

# {{{ header

use Irssi (); # which is the minimum required version of Irssi ?
use Irssi::TextUI;

use vars qw($VERSION %IRSSI);

$VERSION = '0.6ca';
%IRSSI = (
	original_authors => q(BC-bd,        Veli,          Timo Sirainen, ).
	                    q(Wouter Coekaerts,    Jean-Yves Lefort), # (decadix)
	original_contact => q(bd@bc-bd.org, veli@piipiip.net, tss@iki.fi, ).
	                    q(wouter@coekaerts.be, jylefort@brutele.be),
	authors          => q(Nei),
	contact          => q(Nei @ anti@conference.jabber.teamidiot.de),
	url              =>  "http://anti.teamidiot.de/",
	name             => q(awl),
	description      => q(Adds a permanent advanced window list on the right or ).
	                    q(in a statusbar.),
	description2     => q(Based on chanact.pl which was apparently based on ).
	                    q(lightbar.c and nicklist.pl with various other ideas ).
	                    q(from random scripts.),
	license          => q(GNU GPLv2 or later),
);

# }}}

# {{{ *** D O C U M E N T A T I O N ***

# adapted by Nei

###############
# {{{ original comment
# ###########
# # Adds new powerful and customizable [Act: ...] item (chanelnames,modes,alias).
# # Lets you give alias characters to windows so that you can select those with
# # meta-<char>.
# #
# # for irssi 0.8.2 by bd@bc-bd.org
# #
# # inspired by chanlist.pl by 'cumol@hammerhart.de'
# #
# #########
# # {{{ Contributors
# #########
# #
# # veli@piipiip.net   /window_alias code
# # qrczak@knm.org.pl  chanact_abbreviate_names
# # qerub@home.se      Extra chanact_show_mode and chanact_chop_status
# # }}}
# }}}
# 
# {{{ FURTHER THANKS TO
# ############
# # buu, fxn, Somni, Khisanth, integral, tybalt89   for much support in any aspect perl
# # and the channel in general ( #perl @ freenode ) and especially the ir_* functions
# #
# # Valentin 'senneth' Batz ( vb@g-23.org ) for the pointer to grep.pl, continuous support
# #                                         and help in digging up ir_strip_codes
# #
# # OnetrixNET technology networks for the debian environment
# #
# # Monkey-Pirate.com / Spaceman Spiff for the webspace
# #
# }}}

######
# {{{ M A I N    P R O B L E M
#####
#
# It is impossible to place the awl on a statusbar together with other items,
# because I do not know how to calculate the size that it is going to get
# granted, and therefore I cannot do the linebreaks properly.
# This is what is missing to make a nice script out of awl.
# If you have any ideas, please contact me ASAP :).
# }}}
######

######
# {{{ UTF-8 PROBLEM
#####
#
# Please help me find a solution to this:
# this be your statusbar, it is using up the maximum term size
# [[1=1]#abc [2=2]#defghi]
# 
# now consider this example:i
# "ascii" characters are marked with ., utf-8 characters with *
# [[1=1]#... [2=2]#...***]
#
# you should think that this is how it would be displayed? WRONG!
# [[1=1]#... [2=2]#...***   ]
#
# this is what Irssi does.. I believe my length calculating code to be correct,
# however, I'd love to be proven wrong (or receive any other fix, too, of
# course!)
# }}}
######

#########
# {{{ USAGE
###
#
# copy the script to ~/.irssi/scripts/
#
# In irssi:
#
#		/script load awl
#
#
# Hint: to get rid of the old [Act:] display
#     /statusbar window remove act
#
# to get it back:
#     /statusbar window add -after lag -priority 10 act
# }}}
##########
# {{{ OPTIONS
########
#
# {{{ /set awl_display_nokey <string>
#     /set awl_display_key <string>
#     /set awl_display_nokey_active <string>
#     /set awl_display_key_active <string>
#     * string : Format String for one window. The following $'s are expanded:
#         $C : Name
#         $N : Number of the Window
#         $Q : meta-Keymap
#         $H : Start highlighting
#         $S : Stop highlighting
#             /+++++++++++++++++++++++++++++++++,
#            | ****  I M P O R T A N T :  ****  |
#            |                                  |
#            | don't forget  to use  $S  if you |
#            | used $H before!                  |
#            |                                  |
#            '+++++++++++++++++++++++++++++++++/
#       XXX NOTE ON *_active: there is a BUG somewhere in the length
#       XXX calculation. currently it's best to NOT remove $H/$S from those
#       XXX settings if you use it in the non-active settings.
# }}}
# {{{ /set awl_separator <string>
#     * string : Charater to use between the channel entries
#     you'll need to escape " " space and "$" like this:
#     "/set awl_separator \ "
#     "/set awl_separator \$"
#     and {}% like this:
#     "/set awl_separator %{"
#     "/set awl_separator %}"
#     "/set awl_separator %%"
#     (reason being, that the separator is used inside a {format })
# }}}
# {{{ /set awl_prefer_name <ON|OFF>
#     * this setting decides whether awl will use the active_name (OFF) or the
#       window name as the name/caption in awl_display_*.
#       That way you can rename windows using /window name myownname.
# }}}
# {{{ /set awl_hide_data <num>
#     * num : hide the window if its data_level is below num
#     set it to 0 to basically disable this feature,
#               1 if you don't want windows without activity to be shown
#               2 to show only those windows with channel text or hilight
#               3 to show only windows with hilight
# }}}
# {{{ /set awl_maxlines <num>
#     * num : number of lines to use for the window list (0 to disable, negative
#       lock)
# }}}
# {{{ /set awl_columns <num>
#     * num : number of columns to use in screen mode (0 for unlimited)
# }}}
# {{{ /set awl_block <num>
#     * num : width of a column in screen mode (negative values = block display)
#             /+++++++++++++++++++++++++++++++++,
#            | ******  W A R N I N G !  ******  |
#            |                                  |
#            | If  your  block  display  looks  |
#            | DISTORTED,  you need to add the  |
#            | following  line to your  .theme  |
#            | file under                       |
#            |     abstracts = {             :  |
#            |                                  |
#            |       sb_act_none = "%n$*";      |
#            |                                  |
#            '+++++++++++++++++++++++++++++++++/
#.02:08:26. < shi>  Irssi::current_theme()->get_format <.. can this be used?
# }}}
# {{{ /set awl_sbar_maxlength <ON|OFF>
#     * if you enable the maxlength setting, the block width will be used as a
#       maximum length for the non-block statusbar mode too.
# }}}
# {{{ /set awl_height_adjust <num>
#     * num : how many lines to leave empty in screen mode
# }}}
# {{{ /set awl_sort <-data_level|-last_line|refnum>
#     * you can change the window sort order with this variable
#         -data_level : sort windows with hilight first
#         -last_line  : sort windows in order of activity
#         refnum      : sort windows by window number
# }}}
# {{{ /set awl_placement <top|bottom>
#     /set awl_position <num>
#     * these settings correspond to /statusbar because awl will create
#       statusbars for you
#     (see /help statusbar to learn more)
# }}}
# {{{ /set awl_all_disable <ON|OFF>
#     * if you set awl_all_disable to ON, awl will also remove the
#       last statusbar it created if it is empty.
#       As you might guess, this only makes sense with awl_hide_data > 0 ;)
# }}}
# {{{ /set awl_automode <sbar|screen|emulate_lightbar>
#     * this setting defines whether the window list is shown in statusbars or
#       whether the screen hack is used (from nicklist.pl)
# }}}
# }}}
##########
# {{{ COMMANDS
########
# {{{ /awl paste <ON|OFF|TOGGLE>
#     * enables or disables the screen hack windowlist. This is useful when you
#       want to mark & copy text that you want to paste somewhere (hence the
#       name). (ON means AWL disabled!)
#       This is nicely bound to a function key for example.
# }}}
# {{{ /awl redraw
#     * redraws the screen hack windowlist. There are many occasions where the
#       screen hack windowlist can get destroyed so you can use this command to
#       fix it.
# }}}
# }}}
###
# {{{ WISHES
####
#
# if you fiddle with my mess, provide me with your fixes so I can benefit as well
#
# Nei =^.^= ( anti@conference.jabber.teamidiot.de )
# }}}

# }}}

# {{{ modules

#use Class::Classless;
#use Term::Info;

# }}}

# {{{ global variables

my $replaces = '[=]'; # AARGH!!! (chars that are always surrounded by weird
                      # colour codes by Irssi)

my $actString = [];   # statusbar texts
my $currentLines = 0;
my $resetNeeded;      # layout/screen has changed, redo everything
my $needRemake;       # "normal" changes
#my $callcount = 0;
sub GLOB_QUEUE_TIMER () { 100 }
my $globTime = undef; # timer to limit remake() calls


my $SCREEN_MODE;
my $DISABLE_SCREEN_TEMP;
my $currentColumns = 0;
my $screenResizing;
my ($screenHeight, $screenWidth);
my $screenansi = bless {
	NAME => 'Screen::ANSI',
	PARENTS => [],
	METHODS => {
		dcs   => sub { "\033P" },
		st    => sub { "\033\\"},
	}
}, 'Class::Classless::X';
#my $terminfo = new Term::Info 'xterm'; # xterm here, make this modular
# {{{{{{{{{{{{{{{
my $terminfo = bless { # xterm here, make this modular
	NAME => 'Term::Info::xterm',
	PARENTS => [],
	METHODS => {
 # 	civis=\E[?25l,
		civis => sub { "\033[?25l" },
 # 	sc=\E7,
		sc    => sub { "\0337" },
 # 	cup=\E[%i%p1%d;%p2%dH,
		cup   => sub { shift;shift; "\033[" . ($_[0] + 1) . ';' . ($_[1] + 1) . 'H' },
 # 	el=\E[K,
		el    => sub { "\033[K" },
 # 	rc=\E8,
		rc    => sub { "\0338" },
 # 	cnorm=\E[?25h,
		cnorm => sub { "\033[?25h" },
 # 	setab=\E[4%p1%dm,
		setab => sub { shift;shift; "\033[4" . $_[0] . 'm' },
 # 	setaf=\E[3%p1%dm,
		setaf => sub { shift;shift; "\033[3" . $_[0] . 'm' },
 # 	bold=\E[1m,
		bold  => sub { "\033[1m" },
 # 	blink=\E[5m,
		blink => sub { "\033[5m" },
 # 	rev=\E[7m,
		rev   => sub { "\033[7m" },
 # 	op=\E[39;49m,
		op    => sub { "\033[39;49m" },
	}
}, 'Class::Classless::X';
# }}}}}}}}}}}}}}}


sub setc () {
	$IRSSI{'name'}
}
sub set ($) {
	setc . '_' . shift
}

# }}}


# {{{ sbar mode

my %statusbars;       # currently active statusbars

# maybe I should just tie the array ?
sub add_statusbar {
	for (@_) {
		# add subs
		for my $l ($_) { {
			no strict 'refs'; # :P
			*{set$l} = sub { awl($l, @_) };
		}; }
		Irssi::command('statusbar ' . (set$_) . ' reset');
		Irssi::command('statusbar ' . (set$_) . ' enable');
		if (lc Irssi::settings_get_str(set 'placement') eq 'top') {
			Irssi::command('statusbar ' . (set$_) . ' placement top');
		}
		if ((my $x = int Irssi::settings_get_int(set 'position')) != 0) {
			Irssi::command('statusbar ' . (set$_) . ' position ' . $x);
		}
		Irssi::command('statusbar ' . (set$_) . ' add -priority 100 -alignment left barstart');
		Irssi::command('statusbar ' . (set$_) . ' add ' . (set$_));
		Irssi::command('statusbar ' . (set$_) . ' add -priority 100 -alignment right barend');
		Irssi::command('statusbar ' . (set$_) . ' disable');
		Irssi::statusbar_item_register(set$_, '$0', set$_);
		$statusbars{$_} = {};
	}
}

sub remove_statusbar {
	for (@_) {
		Irssi::command('statusbar ' . (set$_) . ' reset');
		Irssi::statusbar_item_unregister(set$_); # XXX does this actually work ?
		# DO NOT REMOVE the sub before you have unregistered it :))
		for my $l ($_) { {
			no strict 'refs';
			undef &{set$l};
		}; }
		delete $statusbars{$_};
	}
}

sub syncLines {
	my $temp = $currentLines;
	$currentLines = @$actString;
	#Irssi::print("current lines: $temp new lines: $currentLines");
	my $currMaxLines = Irssi::settings_get_int(set 'maxlines');
	if ($currMaxLines > 0 and @$actString > $currMaxLines) {
		$currentLines = $currMaxLines;
	}
	elsif ($currMaxLines < 0) {
		$currentLines = abs($currMaxLines);
	}
	return if ($temp == $currentLines);
	if ($currentLines > $temp) {
		for ($temp .. ($currentLines - 1)) {
			add_statusbar($_);
			Irssi::command('statusbar ' . (set$_) . ' enable');
		}
	}
	else {
		for ($_ = ($temp - 1); $_ >= $currentLines; $_--) {
			Irssi::command('statusbar ' . (set$_) . ' disable');
			remove_statusbar($_);
		}
	}
}

# FIXME implement $get_size_only check, and user $item->{min|max-size} ??
sub awl {
	my ($line, $item, $get_size_only) = @_;

	if ($needRemake) {
		$needRemake = undef;
		remake();
	}

	my $text = $actString->[$line];  # DO NOT set the actual $actString->[$line] to '' here or
	$text = '' unless defined $text; # you'll screw up the statusbar counter ($currentLines)
	$item->default_handler($get_size_only, $text, '', 1);
}

# remove old statusbars
my %killBar;
sub get_old_status {
	my ($textDest, $cont, $cont_stripped) = @_;
	if ($textDest->{'level'} == 524288 and $textDest->{'target'} eq ''
			and !defined($textDest->{'server'})
	) {
		my $name = quotemeta(set '');
		if ($cont_stripped =~ m/^$name(\d+)\s/) { $killBar{$1} = {}; }
		Irssi::signal_stop();
	}
}
sub killOldStatus {
	%killBar = ();
	Irssi::signal_add_first('print text' => 'get_old_status');
	Irssi::command('statusbar');
	Irssi::signal_remove('print text' => 'get_old_status');
	remove_statusbar(keys %killBar);
}
#killOldStatus();

# end sbar mode }}}


# {{{ keymaps

my %keymap;

sub get_keymap {
	my ($textDest, undef, $cont_stripped) = @_;
	if ($textDest->{'level'} == 524288 and $textDest->{'target'} eq ''
			and !defined($textDest->{'server'})
	) {
		if ($cont_stripped =~ m/((?:meta-)+)(.)\s+change_window (\d+)/) {
			my ($level, $key, $window) = ($1, $2, $3);
			my $numlevel = ($level =~ y/-//) - 1;
			$keymap{$window} = ('-' x $numlevel) . "$key";
		}
		Irssi::signal_stop();
	}
}

sub update_keymap {
	%keymap = ();
	Irssi::signal_remove('command bind' => 'watch_keymap');
	Irssi::signal_add_first('print text' => 'get_keymap');
	Irssi::command('bind'); # stolen from grep
	Irssi::signal_remove('print text' => 'get_keymap');
	Irssi::signal_add('command bind' => 'watch_keymap');
	Irssi::timeout_add_once(100, 'eventChanged', undef);
}

# watch keymap changes
sub watch_keymap {
	Irssi::timeout_add_once(1000, 'update_keymap', undef);
}

update_keymap();

# end keymaps }}}

# {{{ format handling

# a bad way do do expansions but who cares
sub expand {
	my ($string, %format) = @_;
	my ($exp, $repl);
	$string =~ s/\$$exp/$repl/g while (($exp, $repl) = each(%format));
	return $string;
}

my %strip_table = (
	# fe-common::core::formats.c:format_expand_styles
	#      delete                format_backs  format_fores bold_fores   other stuff
	(map { $_ => '' } (split //, '04261537' .  'kbgcrmyw' . 'KBGCRMYW' . 'U9_8:|FnN>#[')),
	#      escape
	(map { $_ => $_ } (split //, '{}%')),
);
sub ir_strip_codes { # strip %codes
	my $o = shift;
	$o =~ s/(%(.))/exists $strip_table{$2} ? $strip_table{$2} : $1/gex;
	$o
}

sub ir_parse_special {
	my $o; my $i = shift;
	#if ($_[0]) { # for the future?!?
	#	eval {
	#		$o = $_[0]->parse_special($i);
	#	};
	#	unless ($@) {
	#		return $o;
	#	}
	#}
	my $win = shift || Irssi::active_win();
	my $server = Irssi::active_server();
	if (ref $win and ref $win->{'active'}) {
		$o = $win->{'active'}->parse_special($i);
	}
	elsif (ref $win and ref $win->{'active_server'}) {
		$o = $win->{'active_server'}->parse_special($i);
	}
	elsif (ref $server) {
		$o =  $server->parse_special($i);
	}
	else {
		$o = Irssi::parse_special($i);
	}
	$o
}
sub ir_parse_special_protected {
	my $o; my $i = shift;
	$i =~ s/
		( \\. ) | # skip over escapes (maybe)
		( \$[^% $\]+ ) # catch special variables
	/
		if ($1) { $1 }
		elsif ($2) { my $i2 = $2; ir_fe(ir_parse_special($i2, @_)) }
		else { $& }
	/gex;
	$i
}


sub sb_ctfe { # Irssi::current_theme->format_expand wrapper
	Irssi::current_theme->format_expand(
		shift,
		(
			Irssi::EXPAND_FLAG_IGNORE_REPLACES
				|
			($_[0]?0:Irssi::EXPAND_FLAG_IGNORE_EMPTY)
		)
	)
}
sub sb_expand { # expand {format }s (and apply parse_special for $vars)
	ir_parse_special(
		sb_ctfe(shift)
	)
}
sub sb_strip {
	ir_strip_codes(
		sb_expand(shift)
	); # does this get us the actual length of that s*ty bar :P ?
}
sub sb_length {
	# unicode cludge, d*mn broken Irssi
	# screw it, this will fail from broken joining anyway (and cause warnings)
	my $term_type = 'term_type';
	if (Irssi::version > 20040819) { # this is probably wrong, but I don't know
		                              # when the setting name got changed
		$term_type = 'term_charset';
	}
	#if (lc Irssi::settings_get_str($term_type) eq '8bit'
	#		or Irssi::settings_get_str($term_type) =~ /^iso/i
	#) {
	#	length(sb_strip(shift))
	#}
	#else {
	my $temp = sb_strip(shift);
	# try to get the displayed width
	my $length;
	eval {
		require Text::CharWidth;
		$length = Text::CharWidth::mbswidth($temp);
	};
	unless ($@) {
		return $length;
	}
	else {
		if (lc Irssi::settings_get_str($term_type) eq 'utf-8') {
			# try to switch on utf8
			eval {
				no warnings;
				require Encode;
				#$temp = Encode::decode_utf8($temp); # thanks for the hint, but I have my
				#                                    # reasons for _utf8_on
				Encode::_utf8_on($temp);
			};
		}
		# there is nothing more I can do
		length($temp)
	}
	#}
}

# !!! G*DD*MN Irssi is adding an additional layer of backslashitis per { } layer
# !!! AND I still don't know what I need to escape.
# !!! and NOONE else seems to know or care either.
# !!! f*ck open source. I mean it.
# XXX any Irssi::print debug statement leads to SEGFAULT - why ?

# major parts of the idea by buu (#perl @ freenode)
# thanks to fxn and Somni for debugging
#	while ($_[0] =~ /(.)/g) {
#		my $c = $1; # XXX sooo... goto kills $1
#		if ($q eq '%') { goto ESC; }

## <freenode:#perl:tybalt89> s/%(.)|(\{)|(\})|(\\|\$)/$1?$1:$2?($level++,$2):$3?($level>$min_level&&$level--,$3):'\\'x(2**$level-1).$4/ge;  # untested...
sub ir_escape {
	my $min_level = $_[1] || 0; my $level = $min_level;
	my $o = shift;
	$o =~ s/
		(	%.	)	| # $1
		(	\{	)	| # $2
		(	\}	)	| # $3
		(	\\	)	| # $4
		(	\$(?=[^\\])	)	| # $5
		(	\$	) # $6
	/
		if ($1) { $1 } # %. escape
		elsif ($2) { $level++; $2 } # { nesting start
		elsif ($3) { if ($level > $min_level) { $level--; } $3 } # } nesting end
		elsif ($4) { '\\'x(2**$level) } # \ needs \\escaping
		elsif ($5) { '\\'x(2**$level-1) . '$' . '\\'x(2**$level-1) } # and $ needs even more because of "parse_special"
		else { '\\'x(2**$level-1) . '$' } # $ needs \$ escaping
	/gex;
	$o
}
#sub ir_escape {
#	my $min_level = $_[1] || 0; my $level = $min_level;
#	my $o = shift;
#	$o =~ s/
#		(	%.	)	| # $1
#		(	\{	)	| # $2
#		(	\}	)	| # $3
#		(	\\	|	\$	)	# $4
#	/
#		if ($1) { $1 } # %. escape
#		elsif ($2) { $level++; $2 } # { nesting start
#		elsif ($3) { if ($level > $min_level) { $level--; } $3 } # } nesting end
#		else { '\\'x(2**($level-1)-1) . $4 } # \ or $ needs \\escaping
#	/gex;
#	$o
#}

sub ir_fe { # try to fix format stuff
	my $x = shift;
	# XXX why do I have to use two/four % here instead of one/two ??
	# answer: you screwed up in ir_escape
	$x =~ s/([%{}])/%$1/g;
	#$x =~ s/(\\|\$|[ ])/\\$1/g; # XXX HOW CAN I HANDLE THE SPACES CORRECTLY XXX
	$x =~ s/(\\|\$)/\\$1/g;
	#$x =~ s/(\$(?=.))|(\$)/$1?"\\\$\\":"\\\$"/ge; # I think this should be here
	#                                              # (logic), but it doesn't work
	#                                              # that way :P
	#$x =~ s/\\/\\\\/g; # that's right, escape escapes
	$x
}
sub ir_ve { # escapes special vars but leave colours alone
	my $x = shift;
	#$x =~ s/([%{}])/%$1/g;
	$x =~ s/(\\|\$|[ ])/\\$1/g;
	$x
}

my %ansi_table;
{
	my ($i, $j, $k) = (0, 0, 0);
	%ansi_table = (
		# fe-common::core::formats.c:format_expand_styles
		#      do                                              format_backs
		(map { $_ => $terminfo->setab($i++) } (split //, '01234567' )),
		#      do                                              format_fores
		(map { $_ => $terminfo->setaf($j++) } (split //, 'krgybmcw' )),
		#      do                                              bold_fores
		(map { $_ => $terminfo->bold() .
		             $terminfo->setaf($k++) } (split //, 'KRGYBMCW')),
		# reset
		#(map { $_ => $terminfo->op() } (split //, 'nN')),
		(map { $_ => $terminfo->op() } (split //, 'n')),
		(map { $_ => "\033[0m" } (split //, 'N')), # XXX quick and DIRTY
		# flash/bright
		F => $terminfo->blink(),
		# reverse
		8 => $terminfo->rev(),
		# bold
		(map { $_ => $terminfo->bold() } (split //, '9_')),
		#      delete                other stuff
		(map { $_ => '' } (split //, ':|>#[')),
		#      escape
		(map { $_ => $_ } (split //, '{}%')),
	)
}
sub formats_to_ansi_basic {
	my $o = shift;
	$o =~ s/(%(.))/exists $ansi_table{$2} ? $ansi_table{$2} : $1/gex;
	$o
}

sub lc1459 ($) { my $x = shift; $x =~ y/A-Z][\^/a-z}{|~/; $x }
Irssi::settings_add_str(setc, 'banned_channels', '');
Irssi::settings_add_bool(setc, 'banned_channels_on', 0);
my %banned_channels = map { lc1459($_) => undef }
split ' ', Irssi::settings_get_str('banned_channels');
Irssi::settings_add_str(setc, 'fancy_abbrev', 'fancy');

# }}}

# {{{ main

sub remake () {
	#$callcount++;
	#my $xx = $callcount; Irssi::print("starting remake [ $xx ]");
	my ($hilight, $number, $display);
	my $separator = '{sb_act_sep ' . Irssi::settings_get_str(set 'separator') .
		'}';
	my $custSort = Irssi::settings_get_str(set 'sort');
	my $custSortDir = 1;
	if ($custSort =~ /^[-!](.*)/) {
		$custSortDir = -1;
		$custSort = $1;
	}

	my @wins = 
		sort {
			(
				( (int($a->{$custSort}) <=> int($b->{$custSort})) * $custSortDir )
					||
				($a->{'refnum'} <=> $b->{'refnum'})
			)
		} Irssi::windows;
	my $block = Irssi::settings_get_int(set 'block');
	my $columns = $currentColumns;
	my $oldActString = $actString if $SCREEN_MODE;
	$actString = $SCREEN_MODE ? ['   A W L'] : [];
	my $line = $SCREEN_MODE ? 1 : 0;
	my $width = $SCREEN_MODE
			?
		$screenWidth - abs($block)*$columns + 1
			:
		([Irssi::windows]->[0]{'width'} - sb_length('{sb x}'));
	my $height = $screenHeight - abs(Irssi::settings_get_int(set
			'height_adjust'));
	my ($numPad, $keyPad) = (0, 0);
	my %abbrevList;
	if ($SCREEN_MODE or Irssi::settings_get_bool(set 'sbar_maxlength')
			or ($block < 0)
	) {
		%abbrevList = ();
		if (Irssi::settings_get_str('fancy_abbrev') !~ /^(no|off|head)/i) {
			my @nameList = map { ref $_ ? $_->get_active_name : '' } @wins;
			for (my $i = 0; $i < @nameList - 1; ++$i) {
				my ($x, $y) = ($nameList[$i], $nameList[$i + 1]);
				for ($x, $y) { s/^[+#!=]// }
				my $res = Algorithm::LCSS::LCSS($x, $y);
				if (defined $res) {
					#Irssi::print("common pattern $x $y : $res");
					#Irssi::print("found at $nameList[$i] ".index($nameList[$i],
					#		$res));
					$abbrevList{$nameList[$i]} = int (index($nameList[$i], $res) +
						(length($res) / 2));
					#Irssi::print("found at ".$nameList[$i+1]." ".index($nameList[$i+1],
					#		$res));
					$abbrevList{$nameList[$i+1]} = int (index($nameList[$i+1], $res) +
						(length($res) / 2));
				}
			}
		}
		if ($SCREEN_MODE or ($block < 0)) {
			$numPad = length((sort { length($b) <=> length($a) } keys %keymap)[0]);
			$keyPad = length((sort { length($b) <=> length($a) } values %keymap)[0]);
		}
	}
	if ($SCREEN_MODE) {
		print STDERR $screenansi->dcs().
		             $terminfo->civis().
						 $terminfo->sc().
						 $screenansi->st();
		if (@$oldActString < 1) {
			print STDERR $screenansi->dcs().
							 $terminfo->cup(0, $width).
			             $actString->[0].
							 $terminfo->el().
			             $screenansi->st();
		}
	}
	foreach my $win (@wins) {
		unless ($SCREEN_MODE) {
			$actString->[$line] = '' unless defined $actString->[$line]
					or Irssi::settings_get_bool(set 'all_disable');
		}

		# all stolen from chanact, what does this code do and why do we need it ?
		!ref($win) && next;

		my $name = $win->get_active_name;
		$name = '*' if (Irssi::settings_get_bool('banned_channels_on') and exists
			$banned_channels{lc1459($name)});
		$name = $win->{'name'} if $name ne '*' and $win->{'name'} ne ''
			and Irssi::settings_get_bool(set 'prefer_name');
		my $active = $win->{'active'};
		my $colour = $win->{'hilight_color'};
		if (!defined $colour) { $colour = ''; }

		if ($win->{'data_level'} < Irssi::settings_get_int(set 'hide_data')) {
			next; } # for Geert
		if    ($win->{'data_level'} == 0) { $hilight = '{sb_act_none '; }
		elsif ($win->{'data_level'} == 1) { $hilight = '{sb_act_text '; }
		elsif ($win->{'data_level'} == 2) { $hilight = '{sb_act_msg '; }
		elsif ($colour             ne '') { $hilight = "{sb_act_hilight_color $colour "; }
		elsif ($win->{'data_level'} == 3) { $hilight = '{sb_act_hilight '; }
		else                              { $hilight = '{sb_act_special '; }

		$number = $win->{'refnum'};
		my @display = ('display_nokey');
		if (defined $keymap{$number} and $keymap{$number} ne '') {
			unshift @display, map { (my $cpy = $_) =~ s/_no/_/; $cpy } @display;
		}
		if (Irssi::active_win->{'refnum'} == $number) {
			unshift @display, map { my $cpy = $_; $cpy .= '_active'; $cpy } @display;
		}
		#Irssi::print("win $number [@display]: " . join '.', split //, join '<<', map {
			#		Irssi::settings_get_str(set $_) } @display);
		$display = (grep { $_ }
			map { Irssi::settings_get_str(set $_) }
			@display)[0];
			#Irssi::print("win $number : " . join '.', split //, $display);

		if ($SCREEN_MODE or Irssi::settings_get_bool(set 'sbar_maxlength')
				or ($block < 0)
		) {
			my $baseLength = sb_length(ir_escape(ir_ve(ir_parse_special_protected(sb_ctfe(
				'{sb_background}' . expand($display,
				C => ir_fe('x'),
				N => $number . (' 'x($numPad - length($number))),
				Q => ir_fe((' 'x($keyPad - length($keymap{$number}))) . $keymap{$number}),
				H => $hilight,
				S => '}{sb_background}'
			), 1), $win)))) - 1;
			my $diff = abs($block) - (length($name) + $baseLength);
			if ($diff < 0) { # too long
				if (abs($diff) >= length($name)) { $name = '' } # forget it
				elsif (abs($diff) + 1 >= length($name)) { $name = substr($name,
						0, 1); }
				else {
					my $middle = exists $abbrevList{$name} ?
					(($abbrevList{$name} + (2*(length($name) / 2)))/3) :
						((Irssi::settings_get_str('fancy_abbrev') =~ /^head/i) ?
								length($name) :
						(length($name) / 2));
					my $cut = int($middle - (abs($diff) / 2) + .55); 
					$cut = 1 if $cut < 1;
					$cut = length($name) - abs($diff) - 1 if $cut > (length($name) -
						abs($diff) - 1);
					$name = substr($name, 0, $cut) . '~' . substr($name, $cut +
						abs($diff) + 1);
				}
			}
			elsif ($SCREEN_MODE or ($block < 0)) {
				$name .= (' ' x $diff);
			}
		}

		my $add = ir_ve(ir_parse_special_protected(sb_ctfe('{sb_background}' . expand($display,
			C => ir_fe($name),
			N => $number . (' 'x($numPad - length($number))),
			Q => ir_fe((' 'x($keyPad - length($keymap{$number}))) . $keymap{$number}),
			H => $hilight,
			S => '}{sb_background}'
		), 1), $win));
		if ($SCREEN_MODE) {
			$actString->[$line] = $add;
			if ((!defined $oldActString->[$line]
					or $oldActString->[$line] ne $actString->[$line])
					and
				$line <= ($columns * $height)
			) {
				print STDERR $screenansi->dcs().
								 $terminfo->cup(($line-1) % $height+1, $width + (
									 abs($block) * int(($line-1) / $height))).
				formats_to_ansi_basic(sb_expand(ir_escape($actString->[$line]))).
								#$terminfo->el().
								 $screenansi->st();
			}
			$line++;
		}
		else {
			#$temp =~ s/\{\S+?(?:\s(.*?))?\}/$1/g;
			#$temp =~ s/\\\\\\\\/\\/g; # XXX I'm actually guessing here, someone point me
			#                          # XXX to docs please
			$actString->[$line] = '' unless defined $actString->[$line];

			# XXX how can I check whether the content still fits in the bar? this would
			# XXX allow awlstatus to reside on a statusbar together with other items...
			if (sb_length(ir_escape($actString->[$line] . $add)) >= $width) {
				# XXX doesn't correctly handle utf-8 multibyte ... help !!?
				$actString->[$line] .= ' ' x ($width - sb_length(ir_escape(
					$actString->[$line])));
				$line++;
			}
			$actString->[$line] .= $add . $separator;
			# XXX if I use these prints, output layout gets screwed up... why ?
			#Irssi::print("line $line: ".$actString->[$line]);
			#Irssi::print("temp $line: ".$temp);
		}
	}

	if ($SCREEN_MODE) {
		while ($line <= ($columns * $height)) {
			print STDERR $screenansi->dcs().
							 $terminfo->cup(($line-1) % $height+1, $width + (
								 abs($block) * int(($line-1) / $height))).
							 $terminfo->el().
							 $screenansi->st();
			$line++;
		}
		print STDERR $screenansi->dcs().
						 $terminfo->rc().
		             $terminfo->cnorm().
						 $screenansi->st();
	}
	else {
		# XXX the Irssi::print statements lead to the MOST WEIRD results
		# e.g.: the loop gets executed TWICE for p > 0 ?!?
		for (my $p = 0; $p < @$actString; $p++) { # wrap each line in {sb }, escape it
			my $x = $actString->[$p];              # properly, etc.
			$x =~ s/\Q$separator\E([ ]*)$/$1/;
			#Irssi::print("[$p]".'current:'.join'.',split//,sb_strip(ir_escape($x,0)));
			#Irssi::print("assumed length before:".sb_length(ir_escape($x,0)));
			$x = "{sb $x}";
			#Irssi::print("[$p]".'new:'.join'.',split//,sb_expand(ir_escape($x,0)));
			#Irssi::print("[$p]".'new:'.join'.',split//,ir_escape($x,0));
			#Irssi::print("assumed length after:".sb_length(ir_escape($x,0)));
			$x = ir_escape($x);
			#Irssi::print("[$p]".'REALnew:'.join'.',split//,sb_strip($x));
			$actString->[$p] = $x;
			# XXX any Irssi::print debug statement leads to SEGFAULT (sometimes) - why ?
		}
	}
	#Irssi::print("remake [ $xx ] finished");
}

sub awlHasChanged () {
	$globTime = undef;
	my $temp = ($SCREEN_MODE ?
		"\\\n" . Irssi::settings_get_int(set 'block').
		Irssi::settings_get_int(set 'height_adjust')
		: "!\n" . Irssi::settings_get_str(set 'placement').
		Irssi::settings_get_int(set 'position')).
		Irssi::settings_get_str(set 'automode');
	if ($temp ne $resetNeeded) { wlreset(); return; }
	#Irssi::print("awl has changed, calls to remake so far: $callcount");
	$needRemake = 1;

	#remake();
	if (
		($SCREEN_MODE and !$DISABLE_SCREEN_TEMP)
			or
		($needRemake and Irssi::settings_get_bool(set 'all_disable'))
			or
		(!Irssi::settings_get_bool(set 'all_disable') and $currentLines < 1)
	) {
		$needRemake = undef;
		remake();
	}

	unless ($SCREEN_MODE) {
		# XXX Irssi crashes if I try to do this without timer, why ? What's the minimum
		# XXX delay I need to use in the timer ?
		Irssi::timeout_add_once(100, 'syncLines', undef);

		for (keys %statusbars) {
			Irssi::statusbar_items_redraw(set$_);
		}
	}
	else {
		Irssi::timeout_add_once(100, 'syncColumns', undef);
	}
}

sub eventChanged () { # Implement a change queue/blocker -.-)
	if (defined $globTime) {
		Irssi::timeout_remove($globTime);
	} # delay the update further
	$globTime = Irssi::timeout_add_once(GLOB_QUEUE_TIMER, 'awlHasChanged', undef);
}

# }}}


# {{{ screen mode

sub screenFullRedraw {
	my ($window) = @_;
	if (!ref $window or $window->{'refnum'} == Irssi::active_win->{'refnum'}) {
		$actString = [];
		eventChanged();
	}
}

sub screenSize { # from nicklist.pl
	$screenResizing = 1;
	# fit screen
	system 'screen -x '.$ENV{'STY'}.' -X fit';
	# get size
	my ($row, $col) = split ' ', `stty size`;
	# set screen width
	$screenWidth = $col-1;
	$screenHeight = $row-1;
	
	# on some recent systems, "screen -X fit; screen -X width -w 50" doesn't work, needs a sleep in between the 2 commands
	# so we wait a second before setting the width
	Irssi::timeout_add_once(100, sub {
		my ($new_irssi_width) = @_;
		$new_irssi_width -= abs(Irssi::settings_get_int(set
				'block'))*$currentColumns - 1;
		system 'screen -x '.$ENV{'STY'}.' -X width -w ' . $new_irssi_width;
		# and then we wait another second for the resizing, and then redraw.
		Irssi::timeout_add_once(10,sub {$screenResizing = 0; screenFullRedraw()}, []);
	}, $screenWidth);
}

sub screenOff {
	my ($unloadMode) = @_;
	Irssi::signal_remove('gui print text finished' => 'screenFullRedraw');
	Irssi::signal_remove('gui page scrolled' => 'screenFullRedraw');
	Irssi::signal_remove('window changed' => 'screenFullRedraw');
	Irssi::signal_remove('window changed automatic' => 'screenFullRedraw');
	if ($unloadMode) {
		Irssi::signal_remove('terminal resized' => 'resizeTerm');
	}
	system 'screen -x '.$ENV{'STY'}.' -X fit';
}

sub syncColumns {
	return if (@$actString == 0);
	my $temp = $currentColumns;
	#Irssi::print("current columns $temp");
	my $height = $screenHeight - abs(Irssi::settings_get_int(set
			'height_adjust'));
	$currentColumns = int(($#$actString-1) / $height) + 1;
	#Irssi::print("objects in actstring:".scalar(@$actString).", screen height:".
	#	$height);
	my $currMaxColumns = Irssi::settings_get_int(set 'columns');
	if ($currMaxColumns > 0 and $currentColumns > $currMaxColumns) {
		$currentColumns = $currMaxColumns;
	}
	elsif ($currMaxColumns < 0) {
		$currentColumns = abs($currMaxColumns);
	}
	return if ($temp == $currentColumns);
	screenSize();
}

#$needRemake = 1;
sub resizeTerm () {
	if ($SCREEN_MODE and !$screenResizing) {
		$screenResizing = 1;
		Irssi::timeout_add_once(10, 'screenSize', undef);
	}
	Irssi::timeout_add_once(100, 'eventChanged', undef);
}

# }}}


# {{{ settings add

Irssi::settings_add_str(setc, set 'display_nokey', '[$N]$H$C$S');
Irssi::settings_add_str(setc, set 'display_key', '[$Q=$N]$H$C$S');
Irssi::settings_add_str(setc, set 'display_nokey_active', '');
Irssi::settings_add_str(setc, set 'display_key_active', '');
Irssi::settings_add_str(setc, set 'separator', "\\ ");
Irssi::settings_add_bool(setc, set 'prefer_name', 0);
Irssi::settings_add_int(setc, set 'hide_data', 0);
Irssi::settings_add_int(setc, set 'maxlines', 9);
Irssi::settings_add_int(setc, set 'columns', 1);
Irssi::settings_add_int(setc, set 'block', 20);
Irssi::settings_add_bool(setc, set 'sbar_maxlength', 0);
Irssi::settings_add_int(setc, set 'height_adjust', 2);
Irssi::settings_add_str(setc, set 'sort', 'refnum');
Irssi::settings_add_str(setc, set 'placement', 'bottom');
Irssi::settings_add_int(setc, set 'position', 0);
Irssi::settings_add_bool(setc, set 'all_disable', 0);
Irssi::settings_add_str(setc, set 'automode', 'sbar');

# }}}


# {{{ init

sub wlreset {
	$actString = [];
	$currentLines = 0; # 1; # mhmmmm .. we actually enable one line down there so
	                        # let's try this.
	#update_keymap();
	killOldStatus();
	# Register statusbar
	#add_statusbar(0);
	#Irssi::command('statusbar wl0 enable');
	my $was_screen_mode = $SCREEN_MODE;
	if ($SCREEN_MODE = (Irssi::settings_get_str(set 'automode') =~ /screen/i)
			and
		!$was_screen_mode
	) {
		if (!defined $ENV{'STY'}) {
			Irssi::print('Screen mode can only be used in GNU screen but no '.
				'screen was found.', MSGLEVEL_CLIENTERROR);
			$SCREEN_MODE = undef;
		}
		else {
			Irssi::signal_add_last('gui print text finished' => 'screenFullRedraw');
			Irssi::signal_add_last('gui page scrolled' => 'screenFullRedraw');
			Irssi::signal_add('window changed' => 'screenFullRedraw');
			Irssi::signal_add('window changed automatic' => 'screenFullRedraw');
		}
	}
	elsif ($was_screen_mode and !$SCREEN_MODE) {
		screenOff();
	}
	$resetNeeded = ($SCREEN_MODE ?
		"\\\n" . Irssi::settings_get_int(set 'block').
		Irssi::settings_get_int(set 'height_adjust')
		: "!\n" . Irssi::settings_get_str(set 'placement').
		Irssi::settings_get_int(set 'position')).
		Irssi::settings_get_str(set 'automode');
	resizeTerm();
}

wlreset();

# }}}


# {{{ unload/deinit

my $Unload;
sub unload ($$$) {
	$Unload = 1;
	# pretend we didn't do anything ASAP
	Irssi::timeout_add_once(10, sub { $Unload = undef; }, undef);
}
# last try to catch a sigsegv
Irssi::signal_add_first('gui exit' => sub { $Unload = undef; });
sub UNLOAD {
	# this might well crash Irssi... try /eval /script unload someotherscript ;
	# /quit (= SEGFAULT !)
	if ($Unload) {
		$actString = ['']; # syncLines(); # XXX Irssi crashes when trying to disable
		killOldStatus();                  # XXX all statusbars ?
		if ($SCREEN_MODE) {
			screenOff('unload mode');
		}
	}
}

# }}}


# {{{ signals

sub addPrintTextHook { # update on print text
	return if $_[0]->{'level'} == 262144 and $_[0]->{'target'} eq ''
			and !defined($_[0]->{'server'});
	if (Irssi::settings_get_str(set 'sort') =~ /^[-!]?last_line$/) {
		Irssi::timeout_add_once(100, 'eventChanged', undef);
	}
}

#sub _x { my ($x, $y) = @_; ($x, sub { Irssi::print('-->signal '.$x); eval "$y();"; }) }
#sub _x { @_ }
Irssi::signal_add_first(
	'command script unload' => 'unload'
);
Irssi::signal_add_last({
	'setup changed' => 'eventChanged',
	'print text' => 'addPrintTextHook',
	'terminal resized' => 'resizeTerm',
	'setup reread' => 'wlreset',
	'window hilight' => 'eventChanged',
});
Irssi::signal_add({
	'window created' => 'eventChanged',
	'window destroyed' => 'eventChanged',
	'window name changed' => 'eventChanged',
	'window refnum changed' => 'eventChanged',
	'window changed' => 'eventChanged',
	'window changed automatic' => 'eventChanged',
});

#Irssi::signal_add('nick mode changed', 'chanactHasChanged'); # relicts

# }}}

# {{{ commands


sub runsub {
	my ($cmd) = @_;
	sub {
		my ($data, $server, $item) = @_;
		Irssi::command_runsub($cmd, $data, $server, $item);
	};
}
Irssi::command_bind( setc() => runsub(setc()) );
Irssi::command_bind( setc() . ' paste' => runsub(setc() . ' paste') );
Irssi::command_bind(
	setc() . ' paste on' => sub {
		return unless $SCREEN_MODE;
		my $was_disabled = $DISABLE_SCREEN_TEMP;
		$DISABLE_SCREEN_TEMP = 1;
		Irssi::print('Paste mode is now ON, '.uc(setc()).' is temporarily '.
		             'disabled.');
		if (!$was_disabled) {
			$screenResizing = 1;
			screenOff();
		}
	}
);
Irssi::command_bind(
	setc() . ' paste off' => sub {
		return unless $SCREEN_MODE;
		my $was_disabled = $DISABLE_SCREEN_TEMP;
		$DISABLE_SCREEN_TEMP = undef;
		Irssi::print('Paste mode is now OFF, '.uc(setc()).' is enabled.');
		if ($was_disabled) {
			$SCREEN_MODE = undef;
			$screenResizing = 0;
			wlreset();
		}
	}
);
Irssi::command_bind(
	setc() . ' paste toggle' => sub {
		if ($DISABLE_SCREEN_TEMP) {
			Irssi::command(setc() . ' paste off');
		}
		else {
			Irssi::command(setc() . ' paste on');
		}
	}
);
Irssi::command_bind(
	setc() . ' redraw' => sub {
		return unless $SCREEN_MODE;
		screenFullRedraw();
	}
);
		

# }}}

# {{{ Algorithm::LCSS module
{
	package Algorithm::Diff;
	# Skip to first "=head" line for documentation.
	use strict;

	use integer;    # see below in _replaceNextLargerWith() for mod to make
						 # if you don't use this

	# McIlroy-Hunt diff algorithm
	# Adapted from the Smalltalk code of Mario I. Wolczko, <mario@wolczko.com>
	# by Ned Konz, perl@bike-nomad.com
	# Updates by Tye McQueen, http://perlmonks.org/?node=tye

	# Create a hash that maps each element of $aCollection to the set of
	# positions it occupies in $aCollection, restricted to the elements
	# within the range of indexes specified by $start and $end.
	# The fourth parameter is a subroutine reference that will be called to
	# generate a string to use as a key.
	# Additional parameters, if any, will be passed to this subroutine.
	#
	# my $hashRef = _withPositionsOfInInterval( \@array, $start, $end, $keyGen );

	sub _withPositionsOfInInterval
	{
		 my $aCollection = shift;    # array ref
		 my $start       = shift;
		 my $end         = shift;
		 my $keyGen      = shift;
		 my %d;
		 my $index;
		 for ( $index = $start ; $index <= $end ; $index++ )
		 {
			  my $element = $aCollection->[$index];
			  my $key = &$keyGen( $element, @_ );
			  if ( exists( $d{$key} ) )
			  {
					unshift ( @{ $d{$key} }, $index );
			  }
			  else
			  {
					$d{$key} = [$index];
			  }
		 }
		 return wantarray ? %d : \%d;
	}

	# Find the place at which aValue would normally be inserted into the
	# array. If that place is already occupied by aValue, do nothing, and
	# return undef. If the place does not exist (i.e., it is off the end of
	# the array), add it to the end, otherwise replace the element at that
	# point with aValue.  It is assumed that the array's values are numeric.
	# This is where the bulk (75%) of the time is spent in this module, so
	# try to make it fast!

	sub _replaceNextLargerWith
	{
		 my ( $array, $aValue, $high ) = @_;
		 $high ||= $#$array;

		 # off the end?
		 if ( $high == -1 || $aValue > $array->[-1] )
		 {
			  push ( @$array, $aValue );
			  return $high + 1;
		 }

		 # binary search for insertion point...
		 my $low = 0;
		 my $index;
		 my $found;
		 while ( $low <= $high )
		 {
			  $index = ( $high + $low ) / 2;

			  # $index = int(( $high + $low ) / 2);  # without 'use integer'
			  $found = $array->[$index];

			  if ( $aValue == $found )
			  {
					return undef;
			  }
			  elsif ( $aValue > $found )
			  {
					$low = $index + 1;
			  }
			  else
			  {
					$high = $index - 1;
			  }
		 }

		 # now insertion point is in $low.
		 $array->[$low] = $aValue;    # overwrite next larger
		 return $low;
	}

	# This method computes the longest common subsequence in $a and $b.

	# Result is array or ref, whose contents is such that
	#   $a->[ $i ] == $b->[ $result[ $i ] ]
	# foreach $i in ( 0 .. $#result ) if $result[ $i ] is defined.

	# An additional argument may be passed; this is a hash or key generating
	# function that should return a string that uniquely identifies the given
	# element.  It should be the case that if the key is the same, the elements
	# will compare the same. If this parameter is undef or missing, the key
	# will be the element as a string.

	# By default, comparisons will use "eq" and elements will be turned into keys
	# using the default stringizing operator '""'.

	# Additional parameters, if any, will be passed to the key generation
	# routine.

	sub _longestCommonSubsequence
	{
		 my $a        = shift;    # array ref or hash ref
		 my $b        = shift;    # array ref or hash ref
		 my $counting = shift;    # scalar
		 my $keyGen   = shift;    # code ref
		 my $compare;             # code ref

		 if ( ref($a) eq 'HASH' )
		 {                        # prepared hash must be in $b
			  my $tmp = $b;
			  $b = $a;
			  $a = $tmp;
		 }

		 # Check for bogus (non-ref) argument values
		 if ( !ref($a) || !ref($b) )
		 {
			  my @callerInfo = caller(1);
			  die 'error: must pass array or hash references to ' . $callerInfo[3];
		 }

		 # set up code refs
		 # Note that these are optimized.
		 if ( !defined($keyGen) )    # optimize for strings
		 {
			  $keyGen = sub { $_[0] };
			  $compare = sub { my ( $a, $b ) = @_; $a eq $b };
		 }
		 else
		 {
			  $compare = sub {
					my $a = shift;
					my $b = shift;
					&$keyGen( $a, @_ ) eq &$keyGen( $b, @_ );
			  };
		 }

		 my ( $aStart, $aFinish, $matchVector ) = ( 0, $#$a, [] );
		 my ( $prunedCount, $bMatches ) = ( 0, {} );

		 if ( ref($b) eq 'HASH' )    # was $bMatches prepared for us?
		 {
			  $bMatches = $b;
		 }
		 else
		 {
			  my ( $bStart, $bFinish ) = ( 0, $#$b );

			  # First we prune off any common elements at the beginning
			  while ( $aStart <= $aFinish
					and $bStart <= $bFinish
					and &$compare( $a->[$aStart], $b->[$bStart], @_ ) )
			  {
					$matchVector->[ $aStart++ ] = $bStart++;
					$prunedCount++;
			  }

			  # now the end
			  while ( $aStart <= $aFinish
					and $bStart <= $bFinish
					and &$compare( $a->[$aFinish], $b->[$bFinish], @_ ) )
			  {
					$matchVector->[ $aFinish-- ] = $bFinish--;
					$prunedCount++;
			  }

			  # Now compute the equivalence classes of positions of elements
			  $bMatches =
				 _withPositionsOfInInterval( $b, $bStart, $bFinish, $keyGen, @_ );
		 }
		 my $thresh = [];
		 my $links  = [];

		 my ( $i, $ai, $j, $k );
		 for ( $i = $aStart ; $i <= $aFinish ; $i++ )
		 {
			  $ai = &$keyGen( $a->[$i], @_ );
			  if ( exists( $bMatches->{$ai} ) )
			  {
					$k = 0;
					for $j ( @{ $bMatches->{$ai} } )
					{

						 # optimization: most of the time this will be true
						 if ( $k and $thresh->[$k] > $j and $thresh->[ $k - 1 ] < $j )
						 {
							  $thresh->[$k] = $j;
						 }
						 else
						 {
							  $k = _replaceNextLargerWith( $thresh, $j, $k );
						 }

						 # oddly, it's faster to always test this (CPU cache?).
						 if ( defined($k) )
						 {
							  $links->[$k] =
								 [ ( $k ? $links->[ $k - 1 ] : undef ), $i, $j ];
						 }
					}
			  }
		 }

		 if (@$thresh)
		 {
			  return $prunedCount + @$thresh if $counting;
			  for ( my $link = $links->[$#$thresh] ; $link ; $link = $link->[0] )
			  {
					$matchVector->[ $link->[1] ] = $link->[2];
			  }
		 }
		 elsif ($counting)
		 {
			  return $prunedCount;
		 }

		 return wantarray ? @$matchVector : $matchVector;
	}

	sub traverse_sequences
	{
		 my $a                 = shift;          # array ref
		 my $b                 = shift;          # array ref
		 my $callbacks         = shift || {};
		 my $keyGen            = shift;
		 my $matchCallback     = $callbacks->{'MATCH'} || sub { };
		 my $discardACallback  = $callbacks->{'DISCARD_A'} || sub { };
		 my $finishedACallback = $callbacks->{'A_FINISHED'};
		 my $discardBCallback  = $callbacks->{'DISCARD_B'} || sub { };
		 my $finishedBCallback = $callbacks->{'B_FINISHED'};
		 my $matchVector = _longestCommonSubsequence( $a, $b, 0, $keyGen, @_ );

		 # Process all the lines in @$matchVector
		 my $lastA = $#$a;
		 my $lastB = $#$b;
		 my $bi    = 0;
		 my $ai;

		 for ( $ai = 0 ; $ai <= $#$matchVector ; $ai++ )
		 {
			  my $bLine = $matchVector->[$ai];
			  if ( defined($bLine) )    # matched
			  {
					&$discardBCallback( $ai, $bi++, @_ ) while $bi < $bLine;
					&$matchCallback( $ai,    $bi++, @_ );
			  }
			  else
			  {
					&$discardACallback( $ai, $bi, @_ );
			  }
		 }

		 # The last entry (if any) processed was a match.
		 # $ai and $bi point just past the last matching lines in their sequences.

		 while ( $ai <= $lastA or $bi <= $lastB )
		 {

			  # last A?
			  if ( $ai == $lastA + 1 and $bi <= $lastB )
			  {
					if ( defined($finishedACallback) )
					{
						 &$finishedACallback( $lastA, @_ );
						 $finishedACallback = undef;
					}
					else
					{
						 &$discardBCallback( $ai, $bi++, @_ ) while $bi <= $lastB;
					}
			  }

			  # last B?
			  if ( $bi == $lastB + 1 and $ai <= $lastA )
			  {
					if ( defined($finishedBCallback) )
					{
						 &$finishedBCallback( $lastB, @_ );
						 $finishedBCallback = undef;
					}
					else
					{
						 &$discardACallback( $ai++, $bi, @_ ) while $ai <= $lastA;
					}
			  }

			  &$discardACallback( $ai++, $bi, @_ ) if $ai <= $lastA;
			  &$discardBCallback( $ai, $bi++, @_ ) if $bi <= $lastB;
		 }

		 return 1;
	}

	sub traverse_balanced
	{
		 my $a                 = shift;              # array ref
		 my $b                 = shift;              # array ref
		 my $callbacks         = shift || {};
		 my $keyGen            = shift;
		 my $matchCallback     = $callbacks->{'MATCH'} || sub { };
		 my $discardACallback  = $callbacks->{'DISCARD_A'} || sub { };
		 my $discardBCallback  = $callbacks->{'DISCARD_B'} || sub { };
		 my $changeCallback    = $callbacks->{'CHANGE'};
		 my $matchVector = _longestCommonSubsequence( $a, $b, 0, $keyGen, @_ );

		 # Process all the lines in match vector
		 my $lastA = $#$a;
		 my $lastB = $#$b;
		 my $bi    = 0;
		 my $ai    = 0;
		 my $ma    = -1;
		 my $mb;

		 while (1)
		 {

			  # Find next match indices $ma and $mb
			  do {
					$ma++;
			  } while(
						 $ma <= $#$matchVector
					&&  !defined $matchVector->[$ma]
			  );

			  last if $ma > $#$matchVector;    # end of matchVector?
			  $mb = $matchVector->[$ma];

			  # Proceed with discard a/b or change events until
			  # next match
			  while ( $ai < $ma || $bi < $mb )
			  {

					if ( $ai < $ma && $bi < $mb )
					{

						 # Change
						 if ( defined $changeCallback )
						 {
							  &$changeCallback( $ai++, $bi++, @_ );
						 }
						 else
						 {
							  &$discardACallback( $ai++, $bi, @_ );
							  &$discardBCallback( $ai, $bi++, @_ );
						 }
					}
					elsif ( $ai < $ma )
					{
						 &$discardACallback( $ai++, $bi, @_ );
					}
					else
					{

						 # $bi < $mb
						 &$discardBCallback( $ai, $bi++, @_ );
					}
			  }

			  # Match
			  &$matchCallback( $ai++, $bi++, @_ );
		 }

		 while ( $ai <= $lastA || $bi <= $lastB )
		 {
			  if ( $ai <= $lastA && $bi <= $lastB )
			  {

					# Change
					if ( defined $changeCallback )
					{
						 &$changeCallback( $ai++, $bi++, @_ );
					}
					else
					{
						 &$discardACallback( $ai++, $bi, @_ );
						 &$discardBCallback( $ai, $bi++, @_ );
					}
			  }
			  elsif ( $ai <= $lastA )
			  {
					&$discardACallback( $ai++, $bi, @_ );
			  }
			  else
			  {

					# $bi <= $lastB
					&$discardBCallback( $ai, $bi++, @_ );
			  }
		 }

		 return 1;
	}

	sub prepare
	{
		 my $a       = shift;    # array ref
		 my $keyGen  = shift;    # code ref

		 # set up code ref
		 $keyGen = sub { $_[0] } unless defined($keyGen);

		 return scalar _withPositionsOfInInterval( $a, 0, $#$a, $keyGen, @_ );
	}

	sub LCS
	{
		 my $a = shift;                  # array ref
		 my $b = shift;                  # array ref or hash ref
		 my $matchVector = _longestCommonSubsequence( $a, $b, 0, @_ );
		 my @retval;
		 my $i;
		 for ( $i = 0 ; $i <= $#$matchVector ; $i++ )
		 {
			  if ( defined( $matchVector->[$i] ) )
			  {
					push ( @retval, $a->[$i] );
			  }
		 }
		 return wantarray ? @retval : \@retval;
	}

	sub LCS_length
	{
		 my $a = shift;                          # array ref
		 my $b = shift;                          # array ref or hash ref
		 return _longestCommonSubsequence( $a, $b, 1, @_ );
	}

	sub LCSidx
	{
		 my $a= shift @_;
		 my $b= shift @_;
		 my $match= _longestCommonSubsequence( $a, $b, 0, @_ );
		 my @am= grep defined $match->[$_], 0..$#$match;
		 my @bm= @{$match}[@am];
		 return \@am, \@bm;
	}

	sub compact_diff
	{
		 my $a= shift @_;
		 my $b= shift @_;
		 my( $am, $bm )= LCSidx( $a, $b, @_ );
		 my @cdiff;
		 my( $ai, $bi )= ( 0, 0 );
		 push @cdiff, $ai, $bi;
		 while( 1 ) {
			  while(  @$am  &&  $ai == $am->[0]  &&  $bi == $bm->[0]  ) {
					shift @$am;
					shift @$bm;
					++$ai, ++$bi;
			  }
			  push @cdiff, $ai, $bi;
			  last   if  ! @$am;
			  $ai = $am->[0];
			  $bi = $bm->[0];
			  push @cdiff, $ai, $bi;
		 }
		 push @cdiff, 0+@$a, 0+@$b
			  if  $ai < @$a || $bi < @$b;
		 return wantarray ? @cdiff : \@cdiff;
	}

	sub diff
	{
		 my $a      = shift;    # array ref
		 my $b      = shift;    # array ref
		 my $retval = [];
		 my $hunk   = [];
		 my $discard = sub {
			  push @$hunk, [ '-', $_[0], $a->[ $_[0] ] ];
		 };
		 my $add = sub {
			  push @$hunk, [ '+', $_[1], $b->[ $_[1] ] ];
		 };
		 my $match = sub {
			  push @$retval, $hunk
					if 0 < @$hunk;
			  $hunk = []
		 };
		 traverse_sequences( $a, $b,
			  { MATCH => $match, DISCARD_A => $discard, DISCARD_B => $add }, @_ );
		 &$match();
		 return wantarray ? @$retval : $retval;
	}

	sub sdiff
	{
		 my $a      = shift;    # array ref
		 my $b      = shift;    # array ref
		 my $retval = [];
		 my $discard = sub { push ( @$retval, [ '-', $a->[ $_[0] ], "" ] ) };
		 my $add = sub { push ( @$retval, [ '+', "", $b->[ $_[1] ] ] ) };
		 my $change = sub {
			  push ( @$retval, [ 'c', $a->[ $_[0] ], $b->[ $_[1] ] ] );
		 };
		 my $match = sub {
			  push ( @$retval, [ 'u', $a->[ $_[0] ], $b->[ $_[1] ] ] );
		 };
		 traverse_balanced(
			  $a,
			  $b,
			  {
					MATCH     => $match,
					DISCARD_A => $discard,
					DISCARD_B => $add,
					CHANGE    => $change,
			  },
			  @_
		 );
		 return wantarray ? @$retval : $retval;
	}

	########################################
	my $Root= __PACKAGE__;
	package Algorithm::Diff::_impl;
	use strict;

	sub _Idx()  { 0 } # $me->[_Idx]: Ref to array of hunk indices
					# 1   # $me->[1]: Ref to first sequence
					# 2   # $me->[2]: Ref to second sequence
	sub _End()  { 3 } # $me->[_End]: Diff between forward and reverse pos
	sub _Same() { 4 } # $me->[_Same]: 1 if pos 1 contains unchanged items
	sub _Base() { 5 } # $me->[_Base]: Added to range's min and max
	sub _Pos()  { 6 } # $me->[_Pos]: Which hunk is currently selected
	sub _Off()  { 7 } # $me->[_Off]: Offset into _Idx for current position
	sub _Min() { -2 } # Added to _Off to get min instead of max+1

	sub Die
	{
		 require Carp;
		 Carp::confess( @_ );
	}

	sub _ChkPos
	{
		 my( $me )= @_;
		 return   if  $me->[_Pos];
		 my $meth= ( caller(1) )[3];
		 Die( "Called $meth on 'reset' object" );
	}

	sub _ChkSeq
	{
		 my( $me, $seq )= @_;
		 return $seq + $me->[_Off]
			  if  1 == $seq  ||  2 == $seq;
		 my $meth= ( caller(1) )[3];
		 Die( "$meth: Invalid sequence number ($seq); must be 1 or 2" );
	}

	sub getObjPkg
	{
		 my( $us )= @_;
		 return ref $us   if  ref $us;
		 return $us . "::_obj";
	}

	sub new
	{
		 my( $us, $seq1, $seq2, $opts ) = @_;
		 my @args;
		 for( $opts->{keyGen} ) {
			  push @args, $_   if  $_;
		 }
		 for( $opts->{keyGenArgs} ) {
			  push @args, @$_   if  $_;
		 }
		 my $cdif= Algorithm::Diff::compact_diff( $seq1, $seq2, @args );
		 my $same= 1;
		 if(  0 == $cdif->[2]  &&  0 == $cdif->[3]  ) {
			  $same= 0;
			  splice @$cdif, 0, 2;
		 }
		 my @obj= ( $cdif, $seq1, $seq2 );
		 $obj[_End] = (1+@$cdif)/2;
		 $obj[_Same] = $same;
		 $obj[_Base] = 0;
		 my $me = bless \@obj, $us->getObjPkg();
		 $me->Reset( 0 );
		 return $me;
	}

	sub Reset
	{
		 my( $me, $pos )= @_;
		 $pos= int( $pos || 0 );
		 $pos += $me->[_End]
			  if  $pos < 0;
		 $pos= 0
			  if  $pos < 0  ||  $me->[_End] <= $pos;
		 $me->[_Pos]= $pos || !1;
		 $me->[_Off]= 2*$pos - 1;
		 return $me;
	}

	sub Base
	{
		 my( $me, $base )= @_;
		 my $oldBase= $me->[_Base];
		 $me->[_Base]= 0+$base   if  defined $base;
		 return $oldBase;
	}

	sub Copy
	{
		 my( $me, $pos, $base )= @_;
		 my @obj= @$me;
		 my $you= bless \@obj, ref($me);
		 $you->Reset( $pos )   if  defined $pos;
		 $you->Base( $base );
		 return $you;
	}

	sub Next {
		 my( $me, $steps )= @_;
		 $steps= 1   if  ! defined $steps;
		 if( $steps ) {
			  my $pos= $me->[_Pos];
			  my $new= $pos + $steps;
			  $new= 0   if  $pos  &&  $new < 0;
			  $me->Reset( $new )
		 }
		 return $me->[_Pos];
	}

	sub Prev {
		 my( $me, $steps )= @_;
		 $steps= 1   if  ! defined $steps;
		 my $pos= $me->Next(-$steps);
		 $pos -= $me->[_End]   if  $pos;
		 return $pos;
	}

	sub Diff {
		 my( $me )= @_;
		 $me->_ChkPos();
		 return 0   if  $me->[_Same] == ( 1 & $me->[_Pos] );
		 my $ret= 0;
		 my $off= $me->[_Off];
		 for my $seq ( 1, 2 ) {
			  $ret |= $seq
					if  $me->[_Idx][ $off + $seq + _Min ]
					<   $me->[_Idx][ $off + $seq ];
		 }
		 return $ret;
	}

	sub Min {
		 my( $me, $seq, $base )= @_;
		 $me->_ChkPos();
		 my $off= $me->_ChkSeq($seq);
		 $base= $me->[_Base] if !defined $base;
		 return $base + $me->[_Idx][ $off + _Min ];
	}

	sub Max {
		 my( $me, $seq, $base )= @_;
		 $me->_ChkPos();
		 my $off= $me->_ChkSeq($seq);
		 $base= $me->[_Base] if !defined $base;
		 return $base + $me->[_Idx][ $off ] -1;
	}

	sub Range {
		 my( $me, $seq, $base )= @_;
		 $me->_ChkPos();
		 my $off = $me->_ChkSeq($seq);
		 if( !wantarray ) {
			  return  $me->[_Idx][ $off ]
					-   $me->[_Idx][ $off + _Min ];
		 }
		 $base= $me->[_Base] if !defined $base;
		 return  ( $base + $me->[_Idx][ $off + _Min ] )
			  ..  ( $base + $me->[_Idx][ $off ] - 1 );
	}

	sub Items {
		 my( $me, $seq )= @_;
		 $me->_ChkPos();
		 my $off = $me->_ChkSeq($seq);
		 if( !wantarray ) {
			  return  $me->[_Idx][ $off ]
					-   $me->[_Idx][ $off + _Min ];
		 }
		 return
			  @{$me->[$seq]}[
						 $me->[_Idx][ $off + _Min ]
					..  ( $me->[_Idx][ $off ] - 1 )
			  ];
	}

	sub Same {
		 my( $me )= @_;
		 $me->_ChkPos();
		 return wantarray ? () : 0
			  if  $me->[_Same] != ( 1 & $me->[_Pos] );
		 return $me->Items(1);
	}

	my %getName;
		 %getName= (
			  same => \&Same,
			  diff => \&Diff,
			  base => \&Base,
			  min  => \&Min,
			  max  => \&Max,
			  range=> \&Range,
			  items=> \&Items, # same thing
		 );

	sub Get
	{
		 my $me= shift @_;
		 $me->_ChkPos();
		 my @value;
		 for my $arg (  @_  ) {
			  for my $word (  split ' ', $arg  ) {
					my $meth;
					if(     $word !~ /^(-?\d+)?([a-zA-Z]+)([12])?$/
						 ||  not  $meth= $getName{ lc $2 }
					) {
						 Die( $Root, ", Get: Invalid request ($word)" );
					}
					my( $base, $name, $seq )= ( $1, $2, $3 );
					push @value, scalar(
						 4 == length($name)
							  ? $meth->( $me )
							  : $meth->( $me, $seq, $base )
					);
			  }
		 }
		 if(  wantarray  ) {
			  return @value;
		 } elsif(  1 == @value  ) {
			  return $value[0];
		 }
		 Die( 0+@value, " values requested from ",
			  $Root, "'s Get in scalar context" );
	}


	my $Obj= getObjPkg($Root);
	no strict 'refs';

	for my $meth (  qw( new getObjPkg )  ) {
		 *{$Root."::".$meth} = \&{$meth};
		 *{$Obj ."::".$meth} = \&{$meth};
	}
	for my $meth (  qw(
		 Next Prev Reset Copy Base Diff
		 Same Items Range Min Max Get
		 _ChkPos _ChkSeq
	)  ) {
		 *{$Obj."::".$meth} = \&{$meth};
	}

};
{
	package Algorithm::LCSS;

	use strict;
	{
		no strict 'refs';
		*traverse_sequences = \&Algorithm::Diff::traverse_sequences;
	}

	sub _tokenize { [split //, $_[0]] }

	sub CSS {
		 my $is_array = ref $_[0] eq 'ARRAY' ? 1 : 0;
		 my ( $seq1, $seq2, @match, $from_match );
		 my $i = 0;
		 if ( $is_array ) {
			  $seq1 = $_[0];
			  $seq2 = $_[1];
			  traverse_sequences( $seq1, $seq2, {
					MATCH => sub { push @{$match[$i]}, $seq1->[$_[0]]; $from_match = 1 },
					DISCARD_A => sub { do{$i++; $from_match = 0} if $from_match },
					DISCARD_B => sub { do{$i++; $from_match = 0} if $from_match },
			  });
		 }
		 else {
			  $seq1 = _tokenize($_[0]);
			  $seq2 = _tokenize($_[1]);
			  traverse_sequences( $seq1, $seq2, {
					MATCH => sub { $match[$i] .= $seq1->[$_[0]]; $from_match = 1 },
					DISCARD_A => sub { do{$i++; $from_match = 0} if $from_match },
					DISCARD_B => sub { do{$i++; $from_match = 0} if $from_match },
			  });
		 }
	  return \@match;
	}

	sub CSS_Sorted {
		 my $match = CSS(@_);
		 if ( ref $_[0] eq 'ARRAY' ) {
			 @$match = map{$_->[0]}sort{$b->[1]<=>$a->[1]}map{[$_,scalar(@$_)]}@$match
		 }
		 else {
			 @$match = map{$_->[0]}sort{$b->[1]<=>$a->[1]}map{[$_,length($_)]}@$match
		 }
	  return $match;
	}

	sub LCSS {
		 my $is_array = ref $_[0] eq 'ARRAY' ? 1 : 0;
		 my $css = CSS(@_);
		 my $index;
		 my $length = 0;
		 if ( $is_array ) {
			  for( my $i = 0; $i < @$css; $i++ ) {
					next unless @{$css->[$i]}>$length;
					$index = $i;
					$length = @{$css->[$i]};
			  }
		 }
		 else {
			  for( my $i = 0; $i < @$css; $i++ ) {
					next unless length($css->[$i])>$length;
					$index = $i;
					$length = length($css->[$i]);
			  }
		 }
	  return $css->[$index];
	}

};
# }}}
#{{{ Class::Classless module
{
	package Class::Classless;
	use strict;
	use vars qw(@ISA);
	use Carp;

	@ISA = ();

	###########################################################################

	@Class::Classless::X::ISA = ();

	###########################################################################
	###########################################################################

	sub Class::Classless::X::AUTOLOAD {
	  # This's the big dispatcher.
	  
	  my $it = shift @_;
	  my $m =  ($Class::Classless::X::AUTOLOAD =~ m/([^:]+)$/s ) 
					 ? $1 : $Class::Classless::X::AUTOLOAD;

	  croak "Can't call Class::Classless methods (like $m) without an object"
		 unless ref $it;  # sanity, basically.

	  my $prevstate;
	  $prevstate = ${shift @_}
		if scalar(@_) && defined($_[0]) &&
			ref($_[0]) eq 'Class::Classless::CALLSTATE::SHIMMY'
	  ;   # A shim!  we were called via $callstate->NEXT

	  my $no_fail = $prevstate ? $prevstate->[3] : undef;
	  my $i       = $prevstate ? ($prevstate->[1] + 1) : 0;
		# where to start scanning
	  my $lineage;

	  # Get the linearization of the ISA tree
	  if($prevstate) {
		 $lineage = $prevstate->[2];
	  } elsif(defined $it->{'ISA_CACHE'} and ref $it->{'ISA_CACHE'} ){
		 $lineage = $it->{'ISA_CACHE'};
	  } else {
		 $lineage = [ &Class::Classless::X::ISA_TREE($it) ];
	  }

	  # Was:
	  #my @lineage =
	  #  $prevstate ? @{$prevstate->[2]}
	  #             : &Class::Classless::X::ISA_TREE($it);
	  # # Get the linearization of the ISA tree
	  # # ISA-memoization happens in the ISA_TREE function.
	  
	  for(; $i < @$lineage; ++$i) {

		 if( !defined($no_fail) and exists($lineage->[$i]{'NO_FAIL'}) ) {
			$no_fail = ($lineage->[$i]{'NO_FAIL'} || 0);
			# so the first NO_FAIL sets it
		 }

		 if(     ref($lineage->[$i]{'METHODS'}     || 0)  # sanity
			&& exists($lineage->[$i]{'METHODS'}{$m})
		 ){
			# We found what we were after.  Now see what to do with it.
			my $v = $lineage->[$i]{'METHODS'}{$m};
			return $v unless defined $v and ref $v;

			if(ref($v) eq 'CODE') { # normal case, I expect!
			  # Used to have copying of the arglist here.
			  #  But it was apparently useless, so I deleted it
			  unshift @_, 
				 $it,                   # $_[0]    -- target object
				 # a NEW callstate
				 bless([$m, $i, $lineage, $no_fail, $prevstate ? 1 : 0],
						 'Class::Classless::CALLSTATE'
						),                # $_[1]    -- the callstate
			  ;
			  goto &{ $v }; # yes, magic goto!  bimskalabim!
			}
			return @$v if ref($v) eq '_deref_array';
			return $$v if ref($v) eq '_deref_scalar';
			return $v; # fallthru
		 }
	  }

	  if($m eq 'DESTROY') { # mitigate DESTROY-lookup failure at global destruction
		 # should be impossible
	  } else {
		 if($no_fail || 0) {
			return;
		 }
		 croak "Can't find ", $prevstate ? 'NEXT method' : 'method',
				 " $m in ", $it->{'NAME'} || $it,
				 " or any ancestors\n";
	  }
	}

	###########################################################################
	###########################################################################

	sub Class::Classless::X::DESTROY {
	  # noop
	}

	###########################################################################
	sub Class::Classless::X::ISA_TREE {
	  # The linearizer!
	  # Returns the search path for $_[0], starting with $_[0]
	  # Possibly memoized.

	  # I stopped being able to understand this algorithm about five
	  #  minutes after I wrote it.
	  use strict;
	  
	  my $set_cache = 0; # flag to set the cache on the way out
	  
	  if(exists($_[0]{'ISA_CACHE'})) {
		 return    @{$_[0]{'ISA_CACHE'}}
		  if defined $_[0]{'ISA_CACHE'}
			  and ref $_[0]{'ISA_CACHE'};
		  
		 # Otherwise, if exists but is not a ref, it's a signal that it should
		 #  be replaced at the earliest, with a listref
		 $set_cache = 1;
	  }
	  
	  my $has_mi = 0; # set to 0 on the first node we see with 2 parents!
	  # First, just figure out what's in the tree.
	  my %last_child = ($_[0] => 1); # as if already seen

	  # if $last_child{$x} == $y, that means:
	  #  1) incidentally, we've passed the node $x before.
	  #  2) $x is the last child of $y,
	  #     so that means that $y can be pushed to the stack only after
	  #      we've pushed $x to the stack.
	  
	  my @tree_nodes;
	  {
		 my $current;
		 my @in_stack = ($_[0]);
		 while(@in_stack) {
			next unless
			 defined($current = shift @in_stack)
			 && ref($current) # sanity
			 && ref($current->{'PARENTS'} || 0) # sanity
			;

			push @tree_nodes, $current;

			$has_mi = 1 if @{$current->{'PARENTS'}} > 1;
			unshift
			  @in_stack,
			  map {
				 if(exists $last_child{$_}) { # seen before!
					$last_child{$_} = $current;
					(); # seen -- don't re-explore
				 } else { # first time seen
					$last_child{$_} = $current;
					$_; # first time seen -- explore now
				 }
			  }
			  @{$current->{'PARENTS'}}
			;
		 }

		 # If there was no MI, then that first scan was sufficient.
		 unless($has_mi) {
			$_[0]{'ISA_CACHE'} = \@tree_nodes if $set_cache;
			return @tree_nodes;
		 }

		 # Otherwise, toss this list and rescan, consulting %last_child
	  }

	  # $last_child{$parent} holds the last (or only) child of $parent
	  # in this tree.  When walking the tree this time, only that
	  # child is authorized to put its parent on the @in_stack.
	  # And that's the only way a node can get added to @in_stack,
	  # except for $_[0] (the start node) being there at the beginning.

	  # Now, walk again, but this time exploring parents the LAST
	  # time seen in the tree, not the first.

	  my @out;
	  {
		 my $current;
		 my @in_stack = ($_[0]);
		 while(@in_stack) {
			next unless defined($current = shift @in_stack) && ref($current);
			push @out, $current; # finally.
			unshift
			  @in_stack,
			  grep(
				 (
					defined($_) # sanity
					&& ref($_)  # sanity
					&& $last_child{$_} eq $current,
				 ),
				 # I'm lastborn (or onlyborn) of this parent
				 # so it's OK to explore now
				 @{$current->{'PARENTS'}}
			  )
			 if ref($current->{'PARENTS'} || 0) # sanity
			;
		 }

		 unless(scalar(@out) == scalar(keys(%last_child))) {
			# the counts should be equal
			my %good_ones;
			@good_ones{@out} = ();
			croak
			  "ISA tree for " .
			  ($_[0]{'NAME'} || $_[0]) .
			  " is apparently cyclic, probably involving the nodes " .
			  nodelist( grep { ref($_) && !exists $good_ones{$_} }
				 values(%last_child) )
			  . "\n";
		 }
	  }
	  #print "Contents of out: ", nodelist(@out), "\n";
	  
	  $_[0]{'ISA_CACHE'} = \@out if $set_cache;
	  return @out;
	}

	###########################################################################

	sub Class::Classless::X::can { # NOT like UNIVERSAL::can ...
	  # return 1 if $it is capable of the method given -- otherwise 0
	  my($it, $m) = @_[0,1];
	  return undef unless ref $it;

	  croak "undef is not a valid method name"       unless defined($m);
	  croak "null-string is not a valid method name" unless length($m);

	  foreach my $o (&Class::Classless::X::ISA_TREE($it)) {
		 return 1
		  if  ref($o->{'METHODS'} || 0)   # sanity
			&& exists $o->{'METHODS'}{$m};
	  }

	  return 0;
	}


	###########################################################################

	sub Class::Classless::X::isa { # Like UNIVERSAL::isa
	  # Returns true for $X->isa($Y) iff $Y is $X or is an ancestor of $X.

	  return unless ref($_[0]) && ref($_[1]);
	  return scalar(grep {$_ eq $_[1]} &Class::Classless::X::ISA_TREE($_[0])); 
	}

	###########################################################################

	sub nodelist { join ', ', map { "" . ($_->{'NAME'} || $_) . ""} @_ }

	###########################################################################
	###########################################################################
	###########################################################################
	# Methods for the CALLSTATE class.
	#  Basically, CALLSTATE objects represent the state of the dispatcher,
	#   frozen at the moment when the method call was dispatched to the
	#   appropriate sub.
	#  In the grand scheme of things, this needn't be a class -- I could
	#   have just made the callstate data-object be a hash with documented
	#   keys, or a closure that responded to only certain parameters,
	#   etc.  But I like it this way.  And I like being able to say simply
	#   $cs->NEXT
	#  Yes, these are a bit cryptically written, but it's behoovy for
	#   them to be very very efficient.

	@Class::Classless::ISA = ();
	sub Class::Classless::CALLSTATE::found_name { $_[0][0] }
		#  the method name called and found
	sub Class::Classless::CALLSTATE::found_depth { $_[0][1] }
		#  my depth in the lineage
	sub Class::Classless::CALLSTATE::lineage { @{$_[0][2]} }
		#  my lineage
	sub Class::Classless::CALLSTATE::target { $_[0][2][  0          ] }
		#  the object that's the target -- same as $_[0] for the method called
	sub Class::Classless::CALLSTATE::home   { $_[0][2][  $_[0][1]   ] }
		#  the object I was found in
	sub Class::Classless::CALLSTATE::sub_found {
	  $_[0][2][  $_[0][1]   ]{'METHODS'}{ $_[0][0] }
	}  #  the routine called

	sub Class::Classless::CALLSTATE::no_fail          {  $_[0][3]         }
	sub Class::Classless::CALLSTATE::set_no_fail_true {  $_[0][3] = 1     }
	sub Class::Classless::CALLSTATE::set_fail_false   {  $_[0][3] = 0     }
	sub Class::Classless::CALLSTATE::set_fail_undef   {  $_[0][3] = undef }

	sub Class::Classless::CALLSTATE::via_next         {  $_[0][4] }

	sub Class::Classless::CALLSTATE::NEXT {
	  #croak "NEXT needs at least one argument: \$cs->NEXT('method'...)"
	  # unless @_ > 1;
		# no longer true.
	  my $cs = shift @_;
	  my $m  = shift @_; # which may be (or come out) undef...
	  $m = $cs->[0] unless defined $m; #  the method name called and found

	  ($cs->[2][0])->$m(
		 bless( \$cs, 'Class::Classless::CALLSTATE::SHIMMY' ),
		 @_
	  );
	}

	###########################################################################
};
#}}}

###############
###
#
# {{{ *** C h a n g e l o g ***
#
# 0.6ca
# - add screen support (from nicklist.pl)
# - rename to adv_windowlist.pl (advanced window list) since it isn't just a
#   window list status bar (wlstat) anymore
# - names can now have a max length and window names can be used
# - fixed a bug with block display in screen mode and statusbar mode
# - added space handling to ir_fe and removed it again
# - now handling formats on my own
# - added warning about missing sb_act_none abstract leading to
# - display*active settings
# - added warning about the bug in awl_display_(no)key_active settings
#
# 0.5d
# - add setting to also hide the last statusbar if empty (awl_all_disable)
# - reverted to old utf8 code to also calculate broken utf8 length correctly
# - simplified dealing with statusbars in wlreset
# - added a little tweak for the renamed term_type somewhere after Irssi 0.8.9
# - fixed bug in handling channel #$$
# - typo on line 200 spotted by f0rked
# - reset background colour at the beginning of an entry
# 
# 0.4d
# - fixed order of disabling statusbars
# - several attempts at special chars, without any real success
#   and much more weird new bugs caused by this
# - setting to specify sort order
# - reduced timeout values
# - added awl_hide_data for Geert Hauwaerts ( geert@irssi.org ) :)
# - make it so the dynamic sub is actually deleted
# - fix a bug with removing of the last separator
# - take into consideration parse_special
# 
# 0.3b
# - automatically kill old statusbars
# - reset on /reload
# - position/placement settings
#
# 0.2
# - automated retrieval of key bindings (thanks grep.pl authors)
# - improved removing of statusbars
# - got rid of status chop
#
# 0.1
# - rewritten to suit my needs
# - based on chanact 0.5.5
# }}}
# vim: se fdm=marker tw=80 :
