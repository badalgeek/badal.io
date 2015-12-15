// Dean Attali / Beautiful Jekyll 2015

// On mobile, hide the avatar when expanding the navbar menu
$('#main-navbar').on('show.bs.collapse', function () {
    $(".navbar").addClass("top-nav-expanded");
})
$('#main-navbar').on('hidden.bs.collapse', function () {
    $(".navbar").removeClass("top-nav-expanded");
})

// 2fc73a3a967e97599c9763d05e564189