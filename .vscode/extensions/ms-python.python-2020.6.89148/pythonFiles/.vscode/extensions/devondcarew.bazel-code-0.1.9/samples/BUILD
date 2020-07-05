# Description: Blaze plugin for various IntelliJ products.

# IJwB tests, run with an IntelliJ plugin SDK
test_suite(
    name = "ijwb_tests",
    tests = [
        "//base:integration_tests",
        "//base:unit_tests",
        "//java:integration_tests",
        "//java:unit_tests",
        "//plugin_dev:integration_tests",
    ],
)

# ASwB tests, run with an Android Studio plugin SDK
test_suite(
    name = "aswb_tests",
    tests = [
        "//aswb:unit_tests",
        "//base:unit_tests",
        "//java:unit_tests",
    ],
)

# CLwB tests, run with a CLion plugin SDK
test_suite(
    name = "clwb_tests",
    tests = [
        "//base:unit_tests",
        "//cpp:unit_tests",
    ],
)

load(
    ":version.bzl",
    "VERSION",
)

# Version file
genrule(
    name = "version",
    srcs = [],
    outs = ["VERSION"],
    cmd = "echo '%s' > $@" % VERSION,
    visibility = ["//visibility:public"],
)
