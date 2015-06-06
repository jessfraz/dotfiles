# TAB complete words from dictionary
# for irssi 0.7.99 by Timo Sirainen
# Greatly modified by Erkki Seppälä to build dictionary of said words

use Irssi;

use vars qw($VERSION %IRSSI);
$VERSION = "0.1";
%IRSSI = (
    authors     => "Erkki Seppälä",
    contact     => "flux\@inside.org",
    name        => "IRC Completion",
    description => "Adds words from IRC to your tab-completion list, plus fixes typos",
    license     => "Public Domain",
    url         => "http://xulfad.inside.org/~flux/software/irssi/",
    changed     => "Thu Feb  7 22:45:55 EET 2002"
);


my @wordHistory;
my %words;
my %permanent;

my $wordChars = join("", ('a'..'z', '0'..'9', 'öä'));
my $maxWords = 5000;
my $minWordLength = 4;
my $maxWordLength = 80;
my $maxTypoLength = 10;
my $permanentThreshold = 1;

my %typoWords;
my $correctWordCounter = 1;
my %correctWordsByIndex;
my %correctWordsByWord;

# by word
sub addCorrectWord {
  my $index = $correctWordsByWord{$_[0]} or 0;
  if ($index > 0) {
    ++$correctWordsByIndex{$index}->[1];
    return $index;
  } else {
    $correctWordsByIndex{$correctWordCounter} = [$_[0], 1];
    $correctWordsByWord{$_[0]} = $correctWordCounter;
    ++$correctWordCounter;
    return $correctWordCounter - 1;
  }
};

# by word
sub delCorrectWord {
  my ($word) = @_;
  my $index = $correctWordsByWord{$word};
  if (--$correctWordsByIndex{$index}->[1] == 0) {
    delete $correctWordsByWord{$correctWordsByIndex{$index}->[0]};
    delete $correctWordsByIndex{$index};
  }
}

sub sig_complete {
  my ($complist, $window, $word, $linestart, $want_space) = @_;

  $word =~ s/([^a-zA-Z0-9])/\\\1/g;

  @$complist = reverse (@$complist, grep(/^$word/, (keys %permanent, keys %words)));

  if (exists $typoWords{$word}) {
    my $correctWord = $correctWordsByIndex{$typoWords{$word}->[0]}->[0];
    @$complist = (@complist, $correctWord);
  }

  my %m = map { ($_ => $n++); } @$complist; 
  @$complist = ();
  foreach my $key (sort keys %m) { 
    $m2{$m{$key}}=$key; 
  } 
  foreach my $key (reverse sort keys %m2) { 
    push @$complist, $m2{$key};
  }
}

# $word, $removes
sub generate_drops {
  my ($word, $changes) = @_;
  my @list;
  for (my $c = 0; $c < length($word) - 1; ++$c) {
    my $misWord = substr($word, 0, $c) . substr($word, $c + 1);
    if ($changes > 1) {
      push @list, generate_drops($misWord, $changes - 1);
    } else {
      push @list, $misWord;
    }
  }
  return @list;
}

sub generate_translations {
  my ($word, $changes) = @_;
  my @list;
  for (my $c = 1; $c < length($word); ++$c) {
    my $misWord = substr($word, 0, $c - 1) . substr($word, $c, 1) . substr($word, $c - 1, 1) . substr($word, $c + 1);
    if ($changes > 1) {
      push @list, generate_drops($misWord, $changes - 1);
    } else {
      push @list, $misWord;
    }
  }
  return @list;
}

# $word
sub generate_typos {
  my $maxTypoLength = Irssi::settings_get_int('irccomplete_maximum_typo_length');
  my ($word) = @_;

  if (length($word) > $maxTypoLength) {
    return ();
  } else {
    return (generate_drops($word, 1), generate_translations($word));
  }
}

sub sig_message {
  my ($server, $message) = @_;
  my $maxWords = Irssi::settings_get_int('irccomplete_words');
  my $minWordLength = Irssi::settings_get_int('irccomplete_minimum_length');
  my $maxWordLength = Irssi::settings_get_int('irccomplete_maximum_length');
  my $wordChars = Irssi::settings_get_str("irccomplete_word_characters");
  my $permanentThreshold = Irssi::settings_get_int('irccomplete_permanent_percent');
  foreach my $word (split(/[^$wordChars]/, $message)) {
    if (length($word) >= $minWordLength && length($word) <= $maxWordLength) {
      if (++$words{$word} > $permanentThreshold / 100.0 * $maxWords) {
	if (++$permanent{$word} == 1) {
	  #Irssi::printformat(MSGLEVEL_CLIENTNOTICE, 'irccomplete_permanent', $word);
	  Irssi::print "Added $word to the list of permanent words";
	}
      }
      push @wordHistory, $word;
      my $wordIndex = addCorrectWord($word);
      foreach my $misword (generate_typos($word, 1)) {
	if (!exists $typoWords{$misword}) {
	  $typoWords{$misword} = [$wordIndex, 1];
	} else {
	  ++$typoWords{$misword}->[1];
	}
      }
      while (@wordHistory > $maxWords) {
	my $word = shift @wordHistory;
	if (--$words{$word} == 0) {
	  delete $words{$word};
	}
	foreach my $misword (generate_typos($word, 1)) {
	  if (--$typoWords{$misword}->[1] == 0) {
	    delete $typoWords{$misword};
	  }
	}
	delCorrectWord($word);
      }
    }
  }


  return 1;
}

sub cmd_typowords {
  Irssi::print (scalar(@wordHistory) . " words, " . 
		scalar(keys %typoWords) . " typowords, " .
		scalar(keys %correctWordsByWord) . "x" . scalar(keys %correctWordsByIndex) . " correct words");
  my $line = "";

  foreach my $word (keys %typoWords) {
    $line .= $word . "|" . $typoWords{$word}->[0] . " ";
  }
  Irssi::print "$line";
  $line = "";

  foreach my $index (keys %correctWordsByIndex) {
    $line .= $index . ":[" . join("|", @{$correctWordsByIndex{$index}}) . "] ";
  }
  Irssi::print "$line";
  $line = "";
  
  foreach my $word (keys %correctWordsByWord) {
    $line .= $word . ":" . $correctWordsByWord{$word} . " ";
  }
  Irssi::print "$line";
  $line = "";
  
  return 1;
};

Irssi::theme_register(['irccomplete_permanent', 'Added $1 to the list of permanent words']);

Irssi::settings_add_str("misc", "irccomplete_word_characters", $wordChars);
Irssi::settings_add_int("misc", "irccomplete_words", $maxWords);
Irssi::settings_add_int("misc", "irccomplete_minimum_length", $minWordLength);
Irssi::settings_add_int("misc", "irccomplete_maximum_length", $maxWordLength);
Irssi::settings_add_int("misc", "irccomplete_maximum_typo_length", $maxTypoLength);
Irssi::settings_add_int("misc", "irccomplete_permanent_percent", $permanentThreshold);

foreach my $sig ("message public", "message private", 
		 "message own_public", "message own_private", 
		 "message topic") {
#foreach my $sig ("message own_public", "message own_private") {
  Irssi::signal_add($sig, "sig_message");
}
Irssi::signal_add_last('complete word', 'sig_complete');

Irssi::command_bind("irccomplete_typowords", "cmd_typowords");
