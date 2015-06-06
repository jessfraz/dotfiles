# QueryResume by Stefan Tomanek <stefan@pico.ruhr.de>
#
use strict;

use vars qw($VERSION %IRSSI);
$VERSION = '2003021201';
%IRSSI = (
    authors     => 'Stefan \'tommie\' Tomanek',
    contact     => 'stefan@pico.ruhr.de',
    name        => 'QueryResume',
    description => 'restores the last lines of a query on re-creation',
    license     => 'GPLv2',
    modules     => 'Date::Format File::Glob',
    changed     => $VERSION,
);  

use Irssi 20020324;
use Date::Format;
use File::Glob ':glob';

sub draw_box ($$$$) {
    my ($title, $text, $footer, $colour) = @_;
    my $box = '';
    #$box .= '%R,--[%n%9%U'.$title.'%U%9%R]%n'."\n";
    foreach (split(/\n/, $text)) {
        #$box .= '%R|%n '.$_."\n";
        $box .= '%w> '.$_."%n\n";
    }
    #$box .= '%R`--<%n'.$footer.'%R>->%n';
    $box =~ s/%.//g unless $colour;
    return $box;
}

sub sig_window_item_new ($$) {
    my ($win, $witem) = @_;
    return unless (ref $witem && $witem->{type} eq 'QUERY');
    my @data;
    my $filename = Irssi::settings_get_str('autolog_path');
    my $servertag = $witem->{server}->{tag};
    my $name = lc $witem->{name};
    $filename =~ s/(\$tag|\$1)/$servertag/g;
    $filename =~ s/\$0/$name/g;
    my @lt = localtime(time);
    my $zone;
    $filename = strftime($filename, @lt, $zone);
    $filename =~ s/(\[|\])/\\$1/g;
    local *F;
    open(F, "<".bsd_glob($filename));
    my $lines = Irssi::settings_get_int('queryresume_lines');
    foreach (<F>) {
	unless (/^--- Log/) {
	    push(@data, $_);
	    shift(@data) if (@data > $lines);
	}
    }
    my $text;
    $text .= $_ foreach @data;
    $text =~ s/%/%%/g;
    $witem->print(draw_box('QueryResume', $text, $filename, 1), MSGLEVEL_CLIENTCRAP) if $text;
}

Irssi::settings_add_int($IRSSI{name}, 'queryresume_lines', 10);

Irssi::signal_add('window item new', 'sig_window_item_new');

