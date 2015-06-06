#
# Link Titles
#
# pbrisbin 2011
#
#   Catch urls in channel and print the page title.
#
#   Most channels I visit have a bot for this, but I wanted the 
#   functionality in queries too. It's an FYI for me and not a service 
#   for the channel, that's why it just prints the title, and doesn't 
#   MSG it.
#
#   Options: lt_in_queries, lt_in_channels. Default is queries only.
#
###
use strict;
use Irssi;
use LWP::Simple;
use HTML::Entities;

use vars qw($VERSION %IRSSI);

$VERSION = '0.1';
%IRSSI = (
  authors     => 'Patrick Brisbin',
  contact     => 'pbrisbin@gmail.com',
  name        => 'Link Titles',
  description => 'Catch urls in a conversation and print their page titles',
  license     => 'GPL',
);

sub parse_url {
  my ($msg) = @_;

  if ($msg =~ /(https?:\/\/\S+)/i) {
    return $1;
  }

  if ($msg =~ /(www\.\S+)/i) {
    return "http://" . $1;
  }

  return "";
}

sub fetch_title {
  my ($url) = @_;

  my $html = get($url);

  if ($html =~ /<title>(.*?)<\/title>/si) {
    my $title = $1;

    # trim and compress whitespace
    $title =~ s/^[\s\t]+//;
    $title =~ s/[\s\t]+$//;
    $title =~ s/[\t]+//g;
    $title =~ s/\s+/ /g;

    # decode
    decode_entities($title);
    return $title;
  }

  return "";
}

sub process {
  my ($msg, $winitem) = @_;

  my $url   = parse_url($msg)   if $msg;
  my $title = fetch_title($url) if $url;

  return unless $title;

  $winitem->print("Title: " . $title);
}

sub handle_message {
  my ($server, $msg, $nick, $address, $channel) = @_;

  my $window;
  my $winitem;

  if ($channel) {
    # a channel window by channel
    $window = Irssi::window_find_item($channel);
  }
  else {
    # find a query window by nick
    $window = Irssi::window_find_item($nick);
  }

  $winitem = $window->{active};

  # note: these if statements are separated for easier debugging
  if ($winitem->{type} eq 'QUERY') {
    if (Irssi::settings_get_bool('lt_in_queries')) {
      process($msg, $winitem);
      return;
    }
  }

  if ($winitem->{type} eq 'CHANNEL') {
    if (Irssi::settings_get_bool('lt_in_channels')) {
      process($msg, $winitem);
      return;
    }
  }
}

Irssi::settings_add_bool('link_titles', 'lt_in_queries', 1);
Irssi::settings_add_bool('link_titles', 'lt_in_channels', 0);

Irssi::signal_add_last('message private', 'handle_message');
Irssi::signal_add_last('message public', 'handle_message');
